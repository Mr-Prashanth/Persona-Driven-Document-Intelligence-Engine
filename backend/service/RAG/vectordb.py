from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever
import uuid
import os
class VectorDB:
    def __init__(self, api_key, index_name, environment):
        self.pc = Pinecone(api_key=api_key) 
        self.index = self.create_index(index_name, environment)

    def create_index(self, index_name, environment):
        if index_name not in self.pc.list_indexes().names():
            self.pc.create_index(
                name=index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region=environment  
                )
            )
        return self.pc.Index(index_name)

    def load_and_split(self, file_path: str):
        # Load PDF
        loader = PyPDFLoader(file_path)
        docs = loader.load()

        # Determine file size in KB
        file_size_kb = os.path.getsize(file_path) // 1024

        # Use scaling factors
        base_chunk_size = 100        # for very small files
        base_overlap = 1

        # Scale chunk size and overlap more slowly
        chunk_size = min(800, int(base_chunk_size * (file_size_kb ** 0.15)))  # slower growth
        chunk_overlap = min(chunk_size // 3, int(base_overlap * (file_size_kb ** 0.05)))  # much slower for overlap

        # Ensure minimum values
        chunk_size = max(100, chunk_size)
        chunk_overlap = max(1, chunk_overlap)

        # Sentence-wise splitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[".", "\n\n", "\n", "!", "?"]
        )

        return splitter.split_documents(docs)

    def Add_file(self, file_path: str, chat_id: str):
        docs = self.load_and_split(file_path)
        records = []
        for doc in docs:
            if not doc.page_content.strip():  # skip empty chunks
                continue
            records.append(
                {
                    "id": str(uuid.uuid4()),
                    "text" : doc.page_content,
                    "source" : os.path.basename(doc.metadata["source"])
                }
            )
        BATCH_SIZE = 50  
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i : i + BATCH_SIZE]
            self.index.upsert_records(records=batch, namespace=chat_id)


    def delete_by_file(self, filename: str, chat_id: str):
        """
        Deletes all vectors from Pinecone where metadata 'chat_id' and 'source' match.
        """
        self.index.delete(filter={"source": {"$eq": filename}}, namespace=chat_id)
    
    def delete_chat(self, chat_id: str):
        """
        Deletes all vectors from Pinecone for the given chat_id (namespace).
        """
        try:
            self.index.delete(delete_all=True, namespace=chat_id)
            print("Chat deleted successfully.")
        except Exception as e:
            print(f"Error deleting chat for chat_id '{chat_id}': {e}")

    def search_chat_auto(self, query: str, chat_id: str):
        """
        Searches Pinecone and returns only results with score >= score_threshold.
        """

        raw = self.index.search(
            namespace=chat_id,
            query={
                "top_k": 10,
                "inputs": {
                    "text": query
                }
            },
            fields=["text"]
        )
        
        return raw


class Retriever(BaseRetriever):
    db: "VectorDB"       
    chat_id: str         
    def _get_relevant_documents(self, query: str):
        if query.strip() == "":
            return []
        raw  = self.db.search_chat_auto(query, self.chat_id)
        docs = []
        for hit in raw['result']['hits']:
            if hit["_score"] > 0.1:
                text = hit['fields']['text']
                docs.append(Document(page_content=text))
        return docs
    

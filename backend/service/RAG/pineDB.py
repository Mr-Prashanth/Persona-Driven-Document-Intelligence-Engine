import os
import uuid
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv


load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV= os.getenv("PINECONE_ENV", "us-west1-gcp") 
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=PINECONE_API_KEY)


# Check if index exists, else create it
if PINECONE_INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=384, 
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region=PINECONE_ENV.replace("-aws", "")  # Adjust region string if needed
        ),
    )

# Get index object
index = pc.Index(PINECONE_INDEX_NAME)


def store_in_pinecone(chunks, chat_id):
    records = []
    for chunk in chunks:
        text = f"{chunk['text']['heading']}\n{chunk['text']['content'] or ''}"
        records.append({
            "id": str(uuid.uuid4()),
            "text": text,                # use 'chunk_text' for auto-embedding
            "page": str(chunk['meta']['page']),  # convert page number to string
            "source": chunk['meta']['source'],
        })

    index.upsert_records(namespace=chat_id, records=records)

def delete_by_file(chat_id: str, filename: str):
    """
    Deletes all vectors from Pinecone where metadata 'chat_id' and 'source' match.
    """

    index.delete(filter={"source": {"$eq": filename}}, namespace=chat_id)

def delete_chat(chat_id: str):
    """
    Deletes all vectors from Pinecone for the given chat_id (namespace).
    """
    try:
        index.delete(delete_all=True, namespace=chat_id)
        print(f"All vectors for chat_id '{chat_id}' deleted successfully.")
    except Exception as e:
        print(f"Error deleting vectors for chat_id '{chat_id}': {e}")


def search_chat_auto(query: str, chat_id: str, score_threshold: float = 0.75):
    """
    Searches Pinecone and returns only results with score >= score_threshold.
    """

    raw_results = index.search(
        namespace=chat_id,
        # include_metadata=False,
        # include_values=False,
        query={
            "top_k": 10,
            "inputs": {
                "text": query
            }
        },
        fields=["text"]
    )

    return raw_results

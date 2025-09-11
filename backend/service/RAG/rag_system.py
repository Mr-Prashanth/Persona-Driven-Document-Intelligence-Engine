from langchain_groq import ChatGroq
from langchain.retrievers import MultiQueryRetriever
# from langchain.chains import RetrievalQA

class RAGSystem:
    def __init__(self, api, retriever, llm_model="llama-3.3-70b-versatile"):
        self.llm = ChatGroq(api_key=api, model_name=llm_model)
        self.retriever = MultiQueryRetriever.from_llm(
            retriever=retriever,
            llm=self.llm
        )

    def retrieve(self, text):

        return self.retriever.invoke(text) 

    def generate(self, user_query: str, retrieved_texts: list[str]) -> str:
        if not retrieved_texts:  # when no docs are found
            return "No relevant information found"

        raw_text = "\n\n".join(retrieved_texts)

        prompt = f"""
        You are a text formatter. You will be given:
        1. A user query
        2. Raw extracted text chunks

        Your job:
        - Select only the information relevant to the query
        - Remove duplicates, redundant, and unnecessary fragments
        - Rephrase slightly for clarity if needed
        - STRICTLY do not add new knowledge
        - Output only the cleaned statements as **Markdown bullet points**

        User Query:
        {user_query}

        Extracted Text:
        {raw_text}

        Return only the final cleaned Markdown bullet points:
        """
        response = self.llm.invoke(prompt)
        return response.content

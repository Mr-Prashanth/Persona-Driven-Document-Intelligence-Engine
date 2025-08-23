import os
import pymupdf4llm
from .chunks import create_chunks

input_path = r"C:\Users\prash\Downloads\DataMining_CIA_1_Prashanth Project (1).pdf"


def extract_chunks(input_path: str) -> list:

    source = os.path.basename(input_path)
    pdf = pymupdf4llm.to_markdown(input_path, page_chunks=True)

    chunks = []
    for page_data in pdf:
        page_number = page_data['metadata']['page']
        page_text = page_data['text']
        chunk = create_chunks(page_text, page_number=page_number, source=source) # {heading :, content: , page: , source: }
        chunks.extend(chunk)

    return chunks

if __name__ == "__main__":
    extracted_chunks = extract_chunks(input_path)
    print(extracted_chunks)
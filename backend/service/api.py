from fastapi import FastAPI, File, HTTPException, UploadFile, Form, Query
import shutil
import os
from typing import List
from RAG.extractor import extract_chunks
from RAG.pineDB import store_in_pinecone, delete_vectors_by_file
app = FastAPI()

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload-pdfs")
async def upload_pdfs(
    chat_id: str = Form(...),
    files: List[UploadFile] = File(...)
    
):
    
    try:
        all_chunks = []
        folder_path = os.path.join(UPLOAD_DIR, chat_id)
        os.makedirs(folder_path, exist_ok=True)

        saved_file_paths = []

        for file in files:
            file_path = os.path.join(folder_path, file.filename)
            print(file_path)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_file_paths.append(file_path)
            print(f"Processing file: {file.filename}, size: {os.path.getsize(file_path)} bytes")
            chunks = extract_chunks(file_path)
            all_chunks.extend(chunks)
        if all_chunks != []:
            store_in_pinecone(all_chunks, chat_id=chat_id)
        else:
            return {"message" : "chunks not found"}

        # Delete the saved files locally after processing
        for file_path in saved_file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)

        return {
            "filenames": [f.filename for f in files],
            "total_chunks_processed": len(all_chunks),
            "message": "Files uploaded"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-file")
async def delete_file(
    chat_id: str = Query(..., description="Chat ID folder"),
    filename: str = Query(..., description="Filename to delete")
):
    try:

        # Delete vectors from Pinecone
        delete_vectors_by_file(chat_id, filename)

        return {
            "message": f"Deleted file '{filename}' and associated vectors from chat '{chat_id}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

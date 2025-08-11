from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException
import shutil
import os
from typing import List
from RAG.extractor import extract_chunks
from RAG.pineDB import store_in_pinecone, delete_by_file, delete_chat
app = FastAPI()

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def chunk_list(lst, size):
    """Yield successive chunks of size 'size' from list."""
    for i in range(0, len(lst), size):
        yield lst[i:i + size]

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
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_file_paths.append(file_path)

            chunks = extract_chunks(file_path)
            all_chunks.extend(chunks)

        if all_chunks:
            # Send to Pinecone in batches of 96 or less
            for batch in chunk_list(all_chunks, 96):
                store_in_pinecone(batch, chat_id=chat_id)
        else:
            return {"message": "No chunks found"}

        # Clean up saved files
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
        delete_by_file(chat_id, filename)

        return {
            "message": f"Deleted file '{filename}' and associated vectors from chat '{chat_id}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-chat")
async def delete_chat_endpoint(
    chat_id: str = Query(..., description="Chat ID whose vectors should be deleted")
):
    try:
        delete_chat(chat_id)
        return {
            "message": f"All vectors for chat_id '{chat_id}' deleted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
FROM python:3.12

# Install uv (package manager)
RUN pip install --no-cache-dir uv

# Set working directory
WORKDIR /app

# Copy pyproject.toml & README first (for caching deps)
COPY pyproject.toml README.md ./

# Create virtual environment & install dependencies
RUN uv venv /app/.venv && \
    . /app/.venv/bin/activate && \
    uv sync

# Copy the FastAPI service code
COPY backend/service/ ./backend/service/

# Expose FastAPI port
EXPOSE 3000

# Activate venv and run FastAPI
CMD ["/app/.venv/bin/uvicorn", "backend.service.api:app", "--host", "0.0.0.0", "--port", "3000", "--reload"]

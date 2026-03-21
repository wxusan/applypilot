FROM python:3.10-slim

# Set timezone and essential unix tools
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy just the requirements first so Docker caches the installation layer
COPY backend/requirements.txt ./

# Install python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container
COPY backend/ ./backend/

# Move working directory to where main.py lives
WORKDIR /app/backend

# Railway injects the $PORT dynamically, but we expose an arbitrary default just in case
EXPOSE $PORT

# Start Uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2

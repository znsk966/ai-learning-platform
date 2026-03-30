FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# collectstatic needs SECRET_KEY at build time — use a throwaway value
ARG SECRET_KEY=build-only-placeholder
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Use $PORT for Railway (defaults to 8000 for local docker-compose)
CMD ["sh", "-c", "gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"]

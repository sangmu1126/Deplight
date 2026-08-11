FROM node:24-slim AS frontend-builder

WORKDIR /build/frontend
COPY deplight-app/frontend/package*.json ./
RUN npm ci
COPY deplight-app/frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    AWS_REGION=ap-northeast-2

WORKDIR /app
COPY deplight-platform-v3/dashboard/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --requirement requirements.txt
COPY deplight-platform-v3/dashboard/api ./api
COPY --from=frontend-builder /build/frontend/dist ./static

RUN useradd --create-home --uid 10001 deplight && chown -R deplight:deplight /app
USER deplight

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)" || exit 1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]

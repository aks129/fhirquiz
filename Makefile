up:
        docker compose up -d --build

down:
        docker compose down

logs:
        docker compose logs -f local-hapi

seed:
        curl -s http://localhost:5000/ops/seed-local-fhir | cat
# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution & project files first (layer cache for restore)
COPY ErosMarket.sln ./
COPY ErosMarket.Shared/ErosMarket.Shared.csproj  ErosMarket.Shared/
COPY ErosMarket.Server/ErosMarket.Server.csproj   ErosMarket.Server/

RUN dotnet restore ErosMarket.Server/ErosMarket.Server.csproj

# Copy all source files (excluding node_modules / dist via .dockerignore)
COPY . .

# Publish the API
RUN dotnet publish ErosMarket.Server/ErosMarket.Server.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ─── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Render sets PORT automatically; default to 8080 for local Docker runs
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "ErosMarket.Server.dll"]

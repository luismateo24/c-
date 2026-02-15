# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY ErosMarketApi/*.csproj ./ErosMarketApi/
RUN dotnet restore ErosMarketApi/ErosMarketApi.csproj

COPY . .
RUN dotnet publish ErosMarketApi/ErosMarketApi.csproj -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:$PORT
EXPOSE 8080

ENTRYPOINT ["dotnet", "ErosMarketApi.dll"]

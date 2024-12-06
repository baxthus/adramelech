FROM mcr.microsoft.com/dotnet/runtime:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["adramelech.csproj", "adramelech/"]
RUN dotnet restore "adramelech/adramelech.csproj"

COPY . adramelech/
WORKDIR "/src/adramelech"
RUN dotnet build "adramelech.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "adramelech.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Install Doppler CLI
RUN (curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh || wget -t 3 -qO- https://cli.doppler.com/install.sh) | sh

ENTRYPOINT ["doppler", "run", "--"]
CMD ["dotnet", "adramelech.dll"]
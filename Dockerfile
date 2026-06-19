FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the web project's csproj and restore
COPY CloudEnterpriseApp.Web/*.csproj ./CloudEnterpriseApp.Web/
RUN dotnet restore "CloudEnterpriseApp.Web/CloudEnterpriseApp.Web.csproj"

# Copy everything else and build/publish the web project
COPY . .
RUN dotnet publish "CloudEnterpriseApp.Web/CloudEnterpriseApp.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 80
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CloudEnterpriseApp.Web.dll"]

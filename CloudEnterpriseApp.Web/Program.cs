using Serilog;
using Serilog.Formatting.Compact;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateLogger();

try
{
    Log.Information("Starting web application initialization");
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog(); 
    builder.Services.AddHealthChecks();
    
    // NEW: Register HttpClient for external API calls
    builder.Services.AddHttpClient();

    builder.Services.AddCors(options => 
    {
        options.AddPolicy("AllowAll", 
            policy => policy.AllowAnyOrigin()
                            .AllowAnyMethod()
                            .AllowAnyHeader());
    });

    var app = builder.Build();
    app.UseCors("AllowAll");
    app.UseRouting();
    app.MapHealthChecks("/health");

    app.MapGet("/api/status", (IConfiguration config) =>
    {
        var envName = config.GetValue<string>("AppConfig:EnvironmentName") ?? "Unknown";
        return Results.Ok(new { Status = "Operational", Environment = envName, Timestamp = DateTime.UtcNow });
    });

    // --- UPGRADED: LIVE API PROXY (BFF PATTERN) ---
    // This endpoint now takes a dynamic {word} parameter
    app.MapGet("/api/dictionary/{word}", async (string word, IHttpClientFactory httpClientFactory) =>
    {
        var client = httpClientFactory.CreateClient();
        
        // Calling the live public Dictionary API
        var response = await client.GetAsync($"https://api.dictionaryapi.dev/api/v2/entries/en/{word}");
        
        if (!response.IsSuccessStatusCode)
        {
            return Results.NotFound(new { message = $"No definitions found for '{word}'." });
        }

        var content = await response.Content.ReadAsStringAsync();
        // Return the live JSON back to the React frontend
        return Results.Content(content, "application/json");
    });
    // ----------------------------------------------

    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");

    Log.Information("Application booted successfully. Ready for traffic.");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
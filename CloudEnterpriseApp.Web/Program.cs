using Serilog;
using Serilog.Formatting.Compact;

// 1. Initialize Compact JSON Logger (Azure Monitor Ready)
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateLogger();

try
{
    Log.Information("Starting web application initialization");
    var builder = WebApplication.CreateBuilder(args);

    // Override native logging with Serilog provider
    builder.Host.UseSerilog(); 

    // 2. Inject Native Health Check Modules
    builder.Services.AddHealthChecks();

    // 3. Configure CORS (Cross-Origin Resource Sharing)
    // This allows your React frontend (on port 5173) to securely talk to this API
    builder.Services.AddCors(options => 
    {
        options.AddPolicy("AllowAll", 
            policy => policy.AllowAnyOrigin()
                            .AllowAnyMethod()
                            .AllowAnyHeader());
    });

    var app = builder.Build();

    // 4. Activate the CORS policy
    // CRITICAL: This must go exactly here, BEFORE UseRouting and MapGet
    app.UseCors("AllowAll");

    app.UseRouting();

    // 5. Map Health Check Route for Azure Load Balancers
    app.MapHealthChecks("/health");

    // 6. Map the Status API Route that React fetches
    app.MapGet("/api/status", (IConfiguration config) =>
    {
        var envName = config.GetValue<string>("AppConfig:EnvironmentName") ?? "Unknown";
        var version = config.GetValue<string>("AppConfig:Version") ?? "0.0.0";

        Log.Information("Status endpoint pinged. Current Environment: {Environment}", envName);

        return Results.Ok(new 
        { 
            Status = "Operational", 
            ActiveEnvironment = envName,
            AppVersion = version,
            Timestamp = DateTime.UtcNow 
        });
    });

    Log.Information("Application booted successfully. Ready for traffic.");
    // 1. ADD THESE THREE LINES EXACTLY HERE:
    // This tells .NET to look for your React files and serve them to the browser
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
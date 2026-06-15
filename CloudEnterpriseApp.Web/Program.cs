using Serilog;
using Serilog.Formatting.Compact;

// 1. Initialize Structured Logging First
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateLogger();

try
{
    Log.Information("Starting web application initialization");
    var builder = WebApplication.CreateBuilder(args);

    // Replace default .NET logging with Serilog
    builder.Host.UseSerilog(); 

    // 2. Register Health Checks
    builder.Services.AddHealthChecks();

    // THIS IS THE FIXED LINE
    var app = builder.Build();

    // Middleware Pipeline
    app.UseRouting();

    // 3. Expose the Health Check Endpoint
    app.MapHealthChecks("/health");

    // 4. Create a General Purpose API Endpoint
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
    
    // THIS is where the app actually runs
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
using ErosMarket.Server.Data;
using ErosMarket.Server.Repositories;
using ErosMarket.Server.Services;
using ErosMarket.Shared.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

Console.WriteLine(">>> CRITICAL: API STARTING UP <<<");

try 
{
    var builder = WebApplication.CreateBuilder(args);

    // Render injects a PORT environment variable — use it if present.
    var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
    Console.WriteLine($"> Using port: {port}");

    builder.Services.AddControllers();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.SetIsOriginAllowed(origin => true) 
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        });
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "ErosMarket API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                new string[] {}
            }
        });
    });

    // DbContext — Neon (PostgreSQL)
    var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") 
        ?? builder.Configuration.GetConnectionString("DefaultConnection");

    if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("postgres://"))
    {
        try 
        {
            Console.WriteLine("> Parsing DATABASE_URL...");
            var databaseUri = new Uri(connectionString);
            var userInfo = databaseUri.UserInfo.Split(':');
            var user = userInfo.Length > 0 ? userInfo[0] : "";
            var pass = userInfo.Length > 1 ? userInfo[1] : "";
            connectionString = $"Host={databaseUri.Host};Port={databaseUri.Port};Database={databaseUri.LocalPath.Substring(1)};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true;";
            Console.WriteLine("> DATABASE_URL parsed successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("> Error parsing DATABASE_URL: " + ex.Message);
        }
    }

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));

    // Repositories & Services
    builder.Services.AddScoped<IProductRepository, ProductRepository>();
    builder.Services.AddScoped<IAuthService, AuthService>();

    // Authentication
    var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? "ClaveTemporalDeSeguridad123!"; // Fallback para que no muera el builder
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "ErosMarketApi";
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ErosMarketUsers";

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateLifetime = true
            };
        });

    Console.WriteLine("> Building application...");
    var app = builder.Build();
    
    // 1. GLOBAL EXCEPTION HANDLER (MUST HAVE CORS)
    app.Use(async (context, next) => {
        try {
            await next();
        } catch (Exception ex) {
            Console.WriteLine($">>> REQUEST ERROR: {ex}");
            context.Response.StatusCode = 500;
            context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            await context.Response.WriteAsJsonAsync(new { error = ex.Message });
        }
    });

    // 2. CORS (EVERYTHING ELSE AFTER THIS)
    app.UseCors("AllowFrontend");

    // 3. LOGGING
    app.Use(async (context, next) =>
    {
        Console.WriteLine($"[DEBUG] {context.Request.Method} {context.Request.Path}");
        await next();
        Console.WriteLine($"[DEBUG] Status: {context.Response.StatusCode}");
    });

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseAuthentication();
    app.UseAuthorization();

    // Diagnostics
    app.MapGet("/", () => "ErosMarket API is Running! Try /api/health or /swagger");
    app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", time = DateTime.UtcNow, database = connectionString?.Contains("Host=") }));
    
    app.MapControllers();

    // Data Seeding
    Console.WriteLine("> Starting data seeding...");
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        try
        {
            context.Database.EnsureCreated();
            if (!context.Roles.Any())
            {
                context.Roles.AddRange(new Role { Name = "Administrador" }, new Role { Name = "Invitado" });
                context.SaveChanges();
            }
                        if (!context.Users.Any())
            {
                using var sha256 = System.Security.Cryptography.SHA256.Create();
                var hash = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes("admin123")));
                var adminRole = context.Roles.FirstOrDefault(r => r.Name == "Administrador");
                if (adminRole != null)
                {
                    context.Users.Add(new User
                    {
                        Username = "Admin",
                        Email = "admin@erosmarket.com",
                        PasswordHash = hash,
                        Role = adminRole,
                        Avatar = "https://i.pravatar.cc/150?u=admin"
                    });
                    context.SaveChanges();
                }
            }

            if (!context.Products.Any())
            {
                context.Products.AddRange(
                    new Product { Name = "Perfume de Feromonas", Price = 45.99m, Emoji = "✨", Description = "Esencia cautivadora para atraer y seducir.", Stock = 100, Category = "Bienestar", ImageUrl = "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Lencería de Seda", Price = 89.00m, Emoji = "🎀", Description = "Conjunto de seda negra con acabados premium.", Stock = 50, Category = "Ropa", ImageUrl = "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Aceite de Masaje", Price = 29.50m, Emoji = "🧴", Description = "Aceite esencial con aroma a ylang-ylang.", Stock = 200, Category = "Cuidado", ImageUrl = "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Vela Aromática", Price = 15.00m, Emoji = "🕯️", Description = "Vela de soja para masajes con calor suave.", Stock = 150, Category = "Hogar", ImageUrl = "https://images.unsplash.com/photo-1602871126344-9791bb31c120?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Lubricante Premium", Price = 19.99m, Emoji = "💧", Description = "Base agua con ácido hialurónico.", Stock = 300, Category = "Bienestar", ImageUrl = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Conjunto Encaje", Price = 55.00m, Emoji = "🖤", Description = "Encaje delicado para momentos especiales.", Stock = 40, Category = "Ropa", ImageUrl = "https://images.unsplash.com/photo-1582142839970-2b9972b68ee6?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Bolas de Geisha", Price = 34.50m, Emoji = "🟣", Description = "Ejercitadores de suelo pélvico de silicona médica.", Stock = 60, Category = "Bienestar", ImageUrl = "https://images.unsplash.com/photo-1615396899839-c99c121888b0?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Antifaz de Satín", Price = 12.00m, Emoji = "🦇", Description = "Bloqueo total de luz con suavidad extrema.", Stock = 80, Category = "Accesorios", ImageUrl = "https://images.unsplash.com/photo-1583073030863-744046d32029?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Pluma de Caricia", Price = 8.50m, Emoji = "🪶", Description = "Suavidad para despertar todos los sentidos.", Stock = 120, Category = "Accesorios", ImageUrl = "https://images.unsplash.com/photo-1551029506-0807d46298a0?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Masajeador Íntimo", Price = 120.00m, Emoji = "🔋", Description = "Tecnología de ondas sónica para placer profundo.", Stock = 25, Category = "Juguetes", ImageUrl = "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Esposas de Peluche", Price = 25.00m, Emoji = "⛓️", Description = "Juegos de rol suaves y seguros.", Stock = 70, Category = "Accesorios", ImageUrl = "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Bombones Eróticos", Price = 18.00m, Emoji = "🍫", Description = "Chocolate suizo con formas sugerentes.", Stock = 100, Category = "Comestibles", ImageUrl = "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Gel Estimulante", Price = 22.00m, Emoji = "🔥", Description = "Efecto calor para mayor sensibilidad.", Stock = 90, Category = "Bienestar", ImageUrl = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Body de Red", Price = 40.00m, Emoji = "🕸️", Description = "Ajuste perfecto y máxima seducción.", Stock = 35, Category = "Ropa", ImageUrl = "https://images.unsplash.com/photo-1594633313229-873f76d99723?auto=format&fit=crop&q=80&w=800", IsActive = true },
                    new Product { Name = "Aceite Comestible", Price = 16.50m, Emoji = "🍓", Description = "Sabor a fresas silvestres.", Stock = 110, Category = "Comestibles", ImageUrl = "https://images.unsplash.com/photo-1608571424271-925183207ec1?auto=format&fit=crop&q=80&w=800", IsActive = true }
                );
                context.SaveChanges();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("> Seeding warning: " + ex.Message);
        }
    }

    Console.WriteLine("> App Run() calling...");
    app.Run();
}
catch (Exception fatalEx)
{
    Console.WriteLine(">>> FATAL ERROR DURING STARTUP: " + fatalEx.ToString());
    throw; // Rethrow para que Render sepa que falló
}

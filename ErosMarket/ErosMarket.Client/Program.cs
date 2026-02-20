using ErosMarket.Client;
using ErosMarket.Client.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Load our custom client config (avoids conflict with the SDK-generated appsettings.json).
var http = new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) };
using var stream = await http.GetStreamAsync("appsettings.client.json");
builder.Configuration.AddJsonStream(stream);

// Read the API base URL. In hosted/dev mode falls back to the app's own base address.
var apiBaseUrl = builder.Configuration["ApiBaseUrl"];
var baseAddress = string.IsNullOrWhiteSpace(apiBaseUrl)
    ? builder.HostEnvironment.BaseAddress
    : apiBaseUrl.TrimEnd('/') + "/";

builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(baseAddress)
});

builder.Services.AddScoped<AuthStateService>();
builder.Services.AddScoped<CartService>();

await builder.Build().RunAsync();

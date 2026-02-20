using ErosMarket.Shared.DTOs;
using Microsoft.JSInterop;

namespace ErosMarket.Client.Services
{
    public class AuthStateService
    {
        private readonly IJSRuntime _js;
        public LoginResponseDTO? CurrentUser { get; private set; }
        public event Action? OnChange;

        public AuthStateService(IJSRuntime js) { _js = js; }

        public async Task InitializeAsync()
        {
            var stored = await _js.InvokeAsync<string?>("localStorage.getItem", "eros_user");
            if (!string.IsNullOrEmpty(stored))
            {
                CurrentUser = System.Text.Json.JsonSerializer.Deserialize<LoginResponseDTO>(stored);
                NotifyChanged();
            }
        }

        public async Task LoginAsync(LoginResponseDTO user)
        {
            CurrentUser = user;
            await _js.InvokeVoidAsync("localStorage.setItem", "eros_user",
                System.Text.Json.JsonSerializer.Serialize(user));
            NotifyChanged();
        }

        public async Task LogoutAsync()
        {
            CurrentUser = null;
            await _js.InvokeVoidAsync("localStorage.removeItem", "eros_user");
            NotifyChanged();
        }

        public async Task UpdateUserAsync(string username, string email, string avatar)
        {
            if (CurrentUser == null) return;
            CurrentUser = new LoginResponseDTO
            {
                Token = CurrentUser.Token,
                Username = username,
                Email = email,
                Role = CurrentUser.Role,
                Avatar = avatar
            };
            await _js.InvokeVoidAsync("localStorage.setItem", "eros_user",
                System.Text.Json.JsonSerializer.Serialize(CurrentUser));
            NotifyChanged();
        }

        public bool IsAdmin => CurrentUser?.Role == "Administrador";
        public bool IsAuthenticated => CurrentUser != null;

        private void NotifyChanged() => OnChange?.Invoke();
    }
}

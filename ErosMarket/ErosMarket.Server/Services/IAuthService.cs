using ErosMarket.Shared.DTOs;
using ErosMarket.Shared.Models;

namespace ErosMarket.Server.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDTO?> LoginAsync(LoginDTO request);
        Task<User?> RegisterAsync(RegisterDTO request);
        Task<bool> UpdateProfileAsync(int userId, string username, string email, string avatar);
    }
}

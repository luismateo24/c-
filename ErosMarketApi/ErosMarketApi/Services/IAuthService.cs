using ErosMarketApi.DTOs;
using ErosMarketApi.Models;

namespace ErosMarketApi.Services
{
    public interface IAuthService
    {
        Task<User?> RegisterAsync(RegisterDTO request);
        Task<LoginResponseDTO?> LoginAsync(LoginDTO request);
        Task<bool> UpdateProfileAsync(int userId, string username, string email, string avatar);
    }
}

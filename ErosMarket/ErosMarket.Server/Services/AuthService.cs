using ErosMarket.Server.Data;
using ErosMarket.Shared.DTOs;
using ErosMarket.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ErosMarket.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<LoginResponseDTO?> LoginAsync(LoginDTO request)
        {
            var user = await _context.Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return null;
            if (!VerifyPasswordHash(request.Password, user.PasswordHash)) return null;

            return new LoginResponseDTO
            {
                Token = CreateToken(user),
                Username = user.Username,
                Email = user.Email,
                Role = user.Role?.Name ?? "Invitado",
                Avatar = user.Avatar
            };
        }

        public async Task<User?> RegisterAsync(RegisterDTO request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email)) return null;
            var guestRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Invitado");
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                Avatar = string.IsNullOrEmpty(request.Avatar) ? "👤" : request.Avatar,
                Role = guestRole
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> UpdateProfileAsync(int userId, string username, string email, string avatar)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;
            user.Username = username;
            user.Email = email;
            if (!string.IsNullOrEmpty(avatar)) user.Avatar = avatar;
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return true;
        }

        private string CreateToken(User user)
        {
            var roleName = user.Role?.Name ?? "Guest";
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, roleName)
            };
            var jwtKey = _configuration["Jwt:Key"]!;
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddMinutes(60),
                signingCredentials: creds,
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"]
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }

        private bool VerifyPasswordHash(string password, string storedHash) =>
            HashPassword(password) == storedHash;
    }
}

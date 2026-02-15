using System.ComponentModel.DataAnnotations;

namespace ErosMarketApi.Models
{
    public class User
    {
        public int Id { get; set; }
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        
        public int RoleId { get; set; }
        public Role? Role { get; set; }
    }
}

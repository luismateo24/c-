using ErosMarketApi.DTOs;
using ErosMarketApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ErosMarketApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<Models.User>> Register(RegisterDTO request)
        {
            var user = await _authService.RegisterAsync(request);
            if (user == null)
            {
                return BadRequest(new { message = "El usuario ya existe o el registro falló." });
            }
            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDTO>> Login(LoginDTO request)
        {
            var result = await _authService.LoginAsync(request);
            if (result == null)
            {
                return Unauthorized(new { message = "Credenciales inválidas." });
            }
            return Ok(result);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDTO request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                return BadRequest("Invalid user ID in token.");
            }

            var result = await _authService.UpdateProfileAsync(userId, request.Username, request.Email, request.Avatar);
            if (!result)
            {
                return NotFound("User not found.");
            }

            return Ok(new { message = "Profile updated successfully" });
        }
    }
}

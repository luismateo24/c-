using ErosMarketApi.Models;
using ErosMarketApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ErosMarketApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _repository;

        public ProductsController(IProductRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            return Ok(await _repository.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Producto no encontrado." });
            }
            return Ok(product);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            try 
            {
                var createdProduct = await _repository.CreateAsync(product);
                return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id }, createdProduct);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error al crear el producto: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            if (id != product.Id)
            {
                return BadRequest(new { message = "El ID del producto no coincide." });
            }

            try
            {
                await _repository.UpdateAsync(product);
                return Ok(new { message = "Producto actualizado correctamente." });
            }
            catch (Exception)
            {
                if ((await _repository.GetByIdAsync(id)) == null)
                {
                    return NotFound(new { message = "Producto no encontrado." });
                }
                return StatusCode(500, new { message = "Error interno del servidor al actualizar." });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Producto no encontrado." });
            }

            await _repository.DeleteAsync(id);
            return Ok(new { message = "Producto eliminado correctamente." });
        }
    }
}

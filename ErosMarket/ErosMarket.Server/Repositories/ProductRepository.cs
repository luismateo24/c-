using ErosMarket.Server.Data;
using ErosMarket.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace ErosMarket.Server.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;
        public ProductRepository(ApplicationDbContext context) { _context = context; }

        public async Task<Product> CreateAsync(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task DeleteAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product != null)
            {
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Product>> GetAllAsync() 
        {
            Console.WriteLine("[DEBUG] Repository: Fetching all products from DB...");
            try 
            {
                var list = await _context.Products.ToListAsync();
                Console.WriteLine($"> DB returned {list.Count} items.");
                return list;
            }
            catch (Exception ex)
            {
                Console.WriteLine(">>> DATABASE ERROR in GetAllAsync: " + ex.Message);
                throw;
            }
        }

        public async Task<Product?> GetByIdAsync(int id) =>
            await _context.Products.FindAsync(id);

        public async Task UpdateAsync(Product product)
        {
            _context.Entry(product).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }
    }
}

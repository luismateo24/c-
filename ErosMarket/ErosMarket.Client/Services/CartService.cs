using ErosMarket.Shared.Models;
using Microsoft.JSInterop;
using System.Text.Json;

namespace ErosMarket.Client.Services
{
    public class CartItem
    {
        public Product Product { get; set; } = new();
        public int Quantity { get; set; } = 1;
        public decimal Total => Product.Price * Quantity;
    }

    public class CartService
    {
        private readonly IJSRuntime _js;
        public List<CartItem> Items { get; private set; } = new();
        public event Action? OnChange;

        public CartService(IJSRuntime js) { _js = js; }

        public async Task InitializeAsync()
        {
            var stored = await _js.InvokeAsync<string?>("localStorage.getItem", "eros_cart");
            if (!string.IsNullOrEmpty(stored))
            {
                var loaded = JsonSerializer.Deserialize<List<CartItem>>(stored);
                if (loaded != null) Items = loaded;
                NotifyChanged();
            }
        }

        public async Task AddToCartAsync(Product product)
        {
            var existing = Items.FirstOrDefault(i => i.Product.Id == product.Id);
            if (existing != null)
                existing.Quantity++;
            else
                Items.Add(new CartItem { Product = product, Quantity = 1 });
            await PersistAsync();
            NotifyChanged();
        }

        public async Task RemoveFromCartAsync(int productId)
        {
            Items.RemoveAll(i => i.Product.Id == productId);
            await PersistAsync();
            NotifyChanged();
        }

        public async Task UpdateQuantityAsync(int productId, int delta)
        {
            var item = Items.FirstOrDefault(i => i.Product.Id == productId);
            if (item != null)
            {
                item.Quantity = Math.Max(1, item.Quantity + delta);
                await PersistAsync();
                NotifyChanged();
            }
        }

        public int TotalCount => Items.Sum(i => i.Quantity);
        public decimal TotalPrice => Items.Sum(i => i.Total);

        private Task PersistAsync() =>
            _js.InvokeVoidAsync("localStorage.setItem", "eros_cart", JsonSerializer.Serialize(Items)).AsTask();

        private void NotifyChanged() => OnChange?.Invoke();
    }
}

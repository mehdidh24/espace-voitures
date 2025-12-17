import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './shared/api.service';
import { Produit } from './shared/produit.modal';
import { Category } from './shared/category.modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  title = 'espace-voitures';

  // Produits
  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  produitSelectionne: Produit | null = null;

  // Recherche / catégorie
  searchTerm = '';
  selectedCategory = '';
  categories: Category[] = [];

  // Panier
  showCart = false;
  cartItems: (Produit & { quantity: number })[] = [];
  cartTotal = 0;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    // Charger les produits
    this.api.getAllProduits().subscribe({
      next: res => {
        this.produits = res;
        this.filteredProduits = [...res];
      },
      error: err => console.error('Erreur API App:', err)
    });

    // Charger les catégories
    this.api.getCategories().subscribe({
      next: res => this.categories = res,
      error: err => console.error('Erreur categories:', err)
    });
  }

  // ============== Routes / affichage ==============

  currentRoute(): string {
    return this.router.url;
  }

  isAccueil(): boolean {
    return this.currentRoute() === '/' || this.currentRoute() === '';
  }

  // ============== Filtrage produits ==============

  filterProduits() {
    const term = this.searchTerm.trim().toLowerCase();
    const category = this.selectedCategory || '';

    this.filteredProduits = this.produits.filter(p => {
      const matchText =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term);

      const matchCategory =
        !category || p.category === category;

      return matchText && matchCategory;
    });
  }

  // ============== Détails produit ==============

  voirDetails(produit: Produit) {
    if (this.produitSelectionne?.id === produit.id) {
      this.produitSelectionne = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.produitSelectionne = produit;
    setTimeout(() => {
      document
        .getElementById('detailsProduit')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/default.jpg';
  }

  // ============== Panier ==============

  toggleCart() {
    this.showCart = !this.showCart;
  }

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  addToCart(produit: Produit) {
    const original = this.produits.find(p => p.id === produit.id);
    if (!original) return;

    if (original.stock <= 0) {
      alert('Stock épuisé !');
      return;
    }

    const exist = this.cartItems.find(p => p.id === produit.id);
    if (exist) {
      exist.quantity += 1;
    } else {
      this.cartItems.push({ ...original, quantity: 1 });
    }

    original.stock--;

    this.updateCartTotal();
    this.filterProduits();
  }

  removeFromCart(item: Produit & { quantity: number }) {
    const index = this.cartItems.findIndex(p => p.id === item.id);
    if (index > -1) {
      const cartItem = this.cartItems[index];

      const original = this.produits.find(p => p.id === cartItem.id);
      if (original) {
        original.stock += cartItem.quantity;
      }

      this.cartItems.splice(index, 1);
      this.updateCartTotal();
      this.filterProduits();
    }
  }

  clearCart() {
    this.cartItems.forEach(item => {
      const original = this.produits.find(p => p.id === item.id);
      if (original) {
        original.stock += item.quantity;
      }
    });

    this.cartItems = [];
    this.updateCartTotal();
    this.filterProduits();
  }

  updateCartTotal() {
    this.cartTotal = this.cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
  }
}

import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ApiService } from './shared/api.service';
import { Produit } from './shared/produit.modal';
import { Category } from './shared/category.modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

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
  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  produitSelectionne: Produit | null = null;
  searchTerm: string = '';
  selectedCategory: string = '';  
  categories: Category[] = [];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    console.log('AppComponent ngOnInit');  
    
    this.api.getAllProduits().subscribe({
      next: (res) => {
        console.log('Produits App:', res.length);  
        this.produits = res;
        this.filteredProduits = [...res];  
      },
      error: (err) => {
        console.error('Erreur API App:', err);
      }
    });
    
    this.api.getCategories().subscribe({
      next: (res) => {
        console.log('Categories App:', res.length);  
        this.categories = res;
      },
      error: (err) => console.error('Erreur categories:', err)
    });
  }

  filterProduits() {
    const term = this.searchTerm.toLowerCase();
    const category = this.selectedCategory || '';  

    this.filteredProduits = this.produits.filter(produit =>
      (produit.name.toLowerCase().includes(term) ||
       produit.description.toLowerCase().includes(term)) &&
      (!category || produit.category === category)  
    );
  }

  get currentRoute(): string {
    return this.router.url;
  }

  isAccueil(): boolean {
    return this.currentRoute === '/' || this.currentRoute === '';
  }

  voirDetails(produit: Produit) {
    if (this.produitSelectionne && this.produitSelectionne.id === produit.id) {
      this.produitSelectionne = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.produitSelectionne = produit;
    
    setTimeout(() => {
      const detailsEl = document.getElementById('detailsProduit');
      detailsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/default.jpg';
  }
}

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../shared/api.service';
import { Produit } from '../shared/produit.modal';
import { Category } from '../shared/category.modal';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-produits',
  templateUrl: './gestion-produits.component.html',
  styleUrls: ['./gestion-produits.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class GestionProduitsComponent implements OnInit {

  formValue!: FormGroup;

  // Liste brute reçue de l’API
  produitsData: Produit[] = [];

  // Liste paginée réellement affichée dans le tableau
  paginatedProduits: Produit[] = [];

  categories: Category[] = [];
  selectedProduit: Produit | null = null;

  imagePreview = '';
  imageFileName = '';

  // Pagination / recherche
  currentPage = 1;
  itemsPerPage = 7;
  totalFilteredItems = 0;
  searchTerm = '';

  // Édition
  isEditing = false;

  // Panier
  cartItems: (Produit & { quantity: number })[] = [];
  cartTotal = 0;

  @ViewChild('formulaireRef', { static: false }) formulaireRef!: ElementRef;

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.getAllProduits();
  }

  // ================== FORMULAIRE ==================

  initForm() {
    this.formValue = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      currency: ['€', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      images: ['']
    });
  }

  loadCategories() {
    this.api.getCategories().subscribe(res => {
      this.categories = res;
    });
  }

  getAllProduits() {
    this.api.getAllProduits().subscribe({
      next: (res) => {
        this.produitsData = res;
        this.applyFilterAndPagination();
      }
    });
  }

  // ================== FILTRE + PAGINATION ==================

  filterProduits() {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  applyFilterAndPagination() {
    let filtered = [...this.produitsData];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    this.totalFilteredItems = filtered.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedProduits = filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilterAndPagination();
    }
  }

  nextPage() {
    if (this.canGoNext()) {
      this.currentPage++;
      this.applyFilterAndPagination();
    }
  }

  canGoNext(): boolean {
    return (this.currentPage * this.itemsPerPage) < this.totalFilteredItems;
  }

  get totalPages(): number {
    return Math.ceil(this.totalFilteredItems / this.itemsPerPage);
  }

  // ================== EDITION PRODUIT ==================

  onEdit(produit: Produit) {
    this.isEditing = true;
    this.selectedProduit = { ...produit };

    this.formValue.patchValue({
      name: produit.name,
      description: produit.description,
      price: produit.price,
      currency: produit.currency,
      stock: produit.stock,
      category: produit.category,
      images: produit.images?.[0] || ''
    });

    this.imagePreview = produit.images?.[0] || '';
    this.imageFileName = produit.images?.[0]?.split('/').pop() || '';

    setTimeout(() => this.scrollToFormulaire(), 100);
  }

  scrollToFormulaire() {
    this.formulaireRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedProduit = null;
    this.formValue.reset({ currency: '€' });
    this.imagePreview = '';
    this.imageFileName = '';
  }

  // ================== CRUD PRODUITS ==================

  ajouterProduit() {
    if (this.formValue.invalid) {
      Swal.fire('Erreur', 'Remplissez tous les champs', 'error');
      return;
    }

    const data: Produit = {
      id: `produit${Date.now()}`,
      name: this.formValue.value.name,
      description: this.formValue.value.description,
      price: parseFloat(this.formValue.value.price),
      currency: this.formValue.value.currency,
      stock: parseInt(this.formValue.value.stock, 10),
      category: this.formValue.value.category,
      images: [this.formValue.value.images || 'assets/images/default.jpg']
    };

    this.api.postProduit(data).subscribe({
      next: () => {
        Swal.fire('✅ Ajouté', 'Produit créé !', 'success');
        this.getAllProduits();
        this.cancelEdit();
      }
    });
  }

  updateProduit() {
    if (this.formValue.invalid || !this.selectedProduit) {
      Swal.fire('Erreur', 'Formulaire invalide', 'error');
      return;
    }

    const data: Produit = {
      ...this.selectedProduit,
      name: this.formValue.value.name,
      description: this.formValue.value.description,
      price: parseFloat(this.formValue.value.price),
      stock: parseInt(this.formValue.value.stock, 10),
      category: this.formValue.value.category,
      images: [this.formValue.value.images || 'assets/images/default.jpg']
    };

    this.api.updateProduit(this.selectedProduit.id, data).subscribe({
      next: () => {
        Swal.fire('✅ Mis à jour', 'Produit modifié !', 'success');
        this.getAllProduits();
        this.cancelEdit();
      }
    });
  }

  deleteProduit(produit: Produit) {
    Swal.fire({
      title: `Supprimer ${produit.name} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteProduit(produit.id).subscribe(() => {
          this.produitsData = this.produitsData.filter(p => p.id !== produit.id);
          this.applyFilterAndPagination();
          Swal.fire('Supprimé', 'Produit supprimé.', 'success');
        });
      }
    });
  }

  // ================== IMAGES ==================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        const fileName = file.name.toLowerCase().replace(/\s+/g, '-');
        const path = `assets/images/${fileName}`;
        this.formValue.patchValue({ images: path });
        this.imageFileName = fileName;
      };
      reader.readAsDataURL(file);
    }
  }

  onImageUrlChanged() {
    let path = this.formValue.get('images')?.value?.trim() || '';
    if (path && !path.startsWith('http') && !path.startsWith('assets/')) {
      path = `assets/images/${path}`;
    }
    this.imagePreview = path;
    this.imageFileName = path.split('/').pop() || '';
    this.formValue.patchValue({ images: path });
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/default.jpg';
  }

  // ================== PANIER & STOCK ==================

  addToCart(produit: Produit) {
    const original = this.produitsData.find(p => p.id === produit.id);
    if (!original) { return; }

    if (original.stock <= 0) {
      Swal.fire('Stock insuffisant', `Le produit ${original.name} est en rupture de stock.`, 'warning');
      return;
    }

    const existInCart = this.cartItems.find(p => p.id === produit.id);
    if (existInCart) {
      existInCart.quantity += 1;
    } else {
      this.cartItems.push({ ...original, quantity: 1 });
    }

    original.stock--;
    this.applyFilterAndPagination();
    this.updateCartTotal();
  }

  removeFromCart(id: string) {
    const index = this.cartItems.findIndex(p => p.id === id);
    if (index > -1) {
      const produitPanier = this.cartItems[index];
      const original = this.produitsData.find(p => p.id === produitPanier.id);
      if (original) {
        original.stock += produitPanier.quantity;
      }
      this.cartItems.splice(index, 1);
      this.applyFilterAndPagination();
      this.updateCartTotal();
    }
  }

  clearCart() {
    this.cartItems.forEach(item => {
      const original = this.produitsData.find(p => p.id === item.id);
      if (original) {
        original.stock += item.quantity;
      }
    });
    this.cartItems = [];
    this.applyFilterAndPagination();
    this.updateCartTotal();
  }

  updateCartTotal() {
    this.cartTotal = this.cartItems.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  }
}

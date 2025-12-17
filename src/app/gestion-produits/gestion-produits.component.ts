import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { CommonModule } from '@angular/common';
import { Produit } from '../shared/produit.modal';
import { Category } from '../shared/category.modal';
import Swal from 'sweetalert2'


@Component({
  selector: 'app-gestion-produits',
  templateUrl: './gestion-produits.component.html',
  styleUrls: ['./gestion-produits.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule]
})
export class GestionProduitsComponent implements OnInit {
  formValue!: FormGroup;
  produitsData: Produit[] = [];
  paginatedProduits: Produit[] = [];
  categories: Category[] = [];
  selectedProduit: Produit | null = null;
  imagePreview: string = '';
  imageFileName: string = '';
  
  currentPage = 1;
  itemsPerPage = 7;
  totalFilteredItems = 0;
  searchTerm = '';
  isEditing = false;

  @ViewChild('formulaireRef', { static: false }) formulaireRef!: ElementRef;

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    console.log('GestionProduits ngOnInit');
    this.initForm();
    this.loadCategories();
    this.getAllProduits();
  }

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
      console.log('Categories:', res);
      this.categories = res;
    });
  }

  getAllProduits() {
    this.api.getAllProduits().subscribe({
      next: (res) => {
        console.log('Produits:', res.length);
        this.produitsData = res;
        this.applyFilterAndPagination();
      },
      error: (err) => console.error('Erreur API:', err)
    });
  }

  filterProduits() {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  applyFilterAndPagination() {
    let filtered = [...this.produitsData];
    
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(produit =>
        produit.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        produit.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        produit.category?.toLowerCase().includes(this.searchTerm.toLowerCase())
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

  onEdit(produit: Produit) {
    this.isEditing = true;
    this.selectedProduit = { ...produit };
    
    this.formValue.patchValue({
      name: produit.name || '',
      description: produit.description || '',
      price: produit.price || 0,
      currency: produit.currency || '€',
      stock: produit.stock || 0,
      category: produit.category || '',
      images: produit.images?.[0] || ''
    });
    this.imagePreview = produit.images?.[0] || '';
    this.imageFileName = this.getImageName(produit.images?.[0] || '');
    
    setTimeout(() => this.scrollToFormulaire(), 100);
  }

  scrollToFormulaire() {
    if (this.formulaireRef) {
      this.formulaireRef.nativeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedProduit = null;
    this.formValue.reset();
    this.formValue.patchValue({ currency: '€' });
    this.imagePreview = '';
    this.imageFileName = '';
  }

  ajouterProduit() {
    if (this.formValue.invalid) {
      this.formValue.markAllAsTouched();
      Swal.fire('Erreur', 'Remplissez tous les champs', 'error');
      return;
    }

    const data = {
      id: `produit${Date.now()}`,
      name: this.formValue.value.name,
      description: this.formValue.value.description,
      price: parseFloat(this.formValue.value.price),
      currency: this.formValue.value.currency,
      stock: parseInt(this.formValue.value.stock),
      category: this.formValue.value.category,
      images: [this.formValue.value.images || 'assets/images/default.jpg']
    };

    this.api.postProduit(data).subscribe({
      next: () => {
        Swal.fire('✅ Ajouté', 'Nouveau produit créé !', 'success');
        this.getAllProduits();
        this.cancelEdit();
      },
      error: (err) => Swal.fire('❌ Erreur', `HTTP ${err.status}`, 'error')
    });
  }

  updateProduit() {
    if (this.formValue.invalid || !this.selectedProduit) {
      Swal.fire('Erreur', 'Formulaire invalide', 'error');
      return;
    }

    const id = String(this.selectedProduit.id);
    const data = {
      id: id,
      name: this.formValue.value.name,
      description: this.formValue.value.description,
      price: parseFloat(this.formValue.value.price),
      currency: this.formValue.value.currency,
      stock: parseInt(this.formValue.value.stock),
      category: this.formValue.value.category,
      images: [this.formValue.value.images || '']
    };

    this.api.updateProduit(id, data).subscribe({
      next: () => {
        Swal.fire('✅ Mis à jour', 'Produit modifié !', 'success');
        this.getAllProduits();
        this.cancelEdit();
      },
      error: (err) => Swal.fire('❌ Erreur', `HTTP ${err.status}`, 'error')
    });
  }

  deleteProduit(produit: Produit) {
    Swal.fire({
      title: `Supprimer ${produit.name} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteProduit(produit.id).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Produit supprimé', 'success');
            this.getAllProduits();
          }
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        const fileName = file.name.toLowerCase().replace(/\s+/g, '-');
        const assetPath = `assets/images/${fileName}`;
        this.formValue.patchValue({ images: assetPath });
        this.imageFileName = fileName;
      };
      reader.readAsDataURL(file);
    }
  }

  onImageUrlChanged() {
    let path = this.formValue.get('images')?.value?.trim();
    
    if (path) {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        this.imagePreview = path;
        this.imageFileName = 'Lien externe';
      } else if (!path.startsWith('assets/')) {
        path = `assets/images/${path}`;
        this.imagePreview = path;
        this.imageFileName = path.split('/').pop() || '';
      } else {
        this.imagePreview = path;
        this.imageFileName = path.split('/').pop() || '';
      }
      this.formValue.patchValue({ images: path });
    }
  }

  getImageName(fullPath: string): string {
    return fullPath.split('/').pop() || '';
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/default.jpg';
  }
}

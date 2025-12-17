import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { Produit } from '../shared/produit.modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-ajout-produit',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './ajout-produit.component.html'
})
export class AjoutProduitComponent implements OnInit {

  produit: Produit = {
    id: '',
    name: '',
    description: '',
    price: 0,
    currency: '€',
    stock: 0,
    category: '',
    images: ['']
  };

  categories: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe(res => {
      this.categories = res;
    });
  }

 
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
     
      const fileName = file.name
        .trim()
        .replace(/\s+/g, '_');

     
      this.produit.images[0] = `assets/images/${fileName}`;

      console.log('URL image produite :', this.produit.images[0]);
    }
  }

  ajouterProduit() {
    if (!this.produit.id || !this.produit.name || !this.produit.category) {
      Swal.fire('Erreur', 'ID, nom et catégorie obligatoires', 'error');
      return;
    }

   
    if (!this.produit.images[0]) {
      Swal.fire('Erreur', 'Veuillez saisir ou sélectionner une image', 'error');
      return;
    }

    console.log('Produit envoyé :', this.produit);

    this.api.postProduit(this.produit).subscribe({
      next: () => {
        Swal.fire('✅ Succès', 'Produit ajouté !', 'success');
        this.resetForm();
      },
      error: (err) => {
        Swal.fire('❌ Erreur', `HTTP ${err.status}`, 'error');
      }
    });
  }

  resetForm() {
    this.produit = {
      id: '',
      name: '',
      description: '',
      price: 0,
      currency: '€',
      stock: 0,
      category: '',
      images: ['']
    };
  }
}

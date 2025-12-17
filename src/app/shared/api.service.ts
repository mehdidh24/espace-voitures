import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Produit } from './produit.modal';
import { Category } from './category.modal';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {}

  
  getAllProduits() { 
    return this.http.get<Produit[]>('http://localhost:3000/produits'); }
  getProduit(id: string | number) { 
    return this.http.get<Produit>(`http://localhost:3000/produits/${id}`); }
  postProduit(produit: Produit) { 
    return this.http.post<Produit>('http://localhost:3000/produits', produit); }
  updateProduit(id: string | number, produit: Produit) { 
    return this.http.put<Produit>(`http://localhost:3000/produits/${id}`, produit); }
  deleteProduit(id: string | number) { 
    return this.http.delete(`http://localhost:3000/produits/${id}`); }

  
    
  getCategories() { 
    return this.http.get<Category[]>('http://localhost:3000/categories'); }
  getCategorie(id: string | number) { 
    return this.http.get<Category>(`http://localhost:3000/categories/${id}`); }
  ajouterCategorie(categorie: Category) { 
    return this.http.post<Category>('http://localhost:3000/categories', categorie); }
  mettreAJourCategorie(id: string | number, categorie: Category) { 
    return this.http.put<Category>(`http://localhost:3000/categories/${id}`, categorie); }
  supprimerCategorie(id: string | number) { 
    return this.http.delete(`http://localhost:3000/categories/${id}`); }
}

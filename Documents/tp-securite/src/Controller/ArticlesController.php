<?php

namespace App\Controller;

use App\Entity\Article;
use App\Form\ArticleType;
use App\Repository\ArticleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ArticlesController extends AbstractController
{
    #[Route('/article/nouveau', name: 'app_article_nouveau')]
    #[IsGranted('ROLE_USER')]  // Seuls les connectés peuvent créer
    public function nouveau(Request $request, EntityManagerInterface $em): Response
    {
        $article = new Article();

        // ✅ Étape 2 : affecter l'utilisateur connecté comme auteur
        $article->setAuteurUser($this->getUser());

        $form = $this->createForm(ArticleType::class, $article);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $em->persist($article);
            $em->flush();

            return $this->redirectToRoute('app_article_liste');
        }

        return $this->render('article/nouveau.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    #[Route('/articles', name: 'app_articles')]
    public function index(ArticleRepository $articleRepository): Response
    {
        $articles = $articleRepository->findAll();

        return $this->render('articles/index.html.twig', [
            'articles' => $articles,
        ]);
    }

    #[Route('/articles/{id}', name: 'app_article_detail', requirements: ['id' => '\d+'])]
    public function detail(Article $article): Response
    {
        return $this->render('articles/detail.html.twig', [
            'article' => $article,
        ]);
    }

    #[Route('/article/modifier/{id}', name: 'app_article_modifier')]
    #[IsGranted('ROLE_USER')]
    public function modifier(Article $article, Request $request, EntityManagerInterface $em): Response
    {
        // ✅ Étape 3 : vérifier que c'est l'auteur ou un admin
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $isAuteur = $this->getUser() === $article->getAuteurUser();

        if (!$isAuteur && !$isAdmin) {
            throw $this->createAccessDeniedException('Vous n\'êtes pas l\'auteur !');
        }

        $form = $this->createForm(ArticleType::class, $article);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $em->flush();

            return $this->redirectToRoute('app_article_liste');
        }

        return $this->render('article/modifier.html.twig', [
            'form' => $form->createView(),
            'article' => $article,
        ]);
    }

    #[Route('/articles/{id}/supprimer', name: 'app_article_supprimer', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function supprimer(Article $article, Request $request, EntityManagerInterface $em): Response
    {
        if ($this->isCsrfTokenValid('supprimer_' . $article->getId(), $request->request->get('_token'))) {
            $em->remove($article);
            $em->flush();

            $this->addFlash('success', 'Article supprimé avec succès.');
        } else {
            $this->addFlash('danger', 'Token CSRF invalide. Suppression annulée.');
        }

        return $this->redirectToRoute('app_articles');
    }
}

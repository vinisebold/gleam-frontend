import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
  afterNextRender,
  Renderer2,
  inject,
  ElementRef,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardPessoa } from '@app/shared/components/card-pessoa/card-pessoa';
import { CarouselScroll } from '@app/shared/components/carousel-scroll/carousel-scroll';
import { environment } from '@env/environment';

interface Membro {
  nome: string;
  email: string;
  telefone: string;
  avatar: string;
  githubUrl: string;
  linkedinUrl: string;
  contribuicoes: string[];
}

@Component({
  selector: 'app-landing',
  imports: [NgOptimizedImage, RouterLink, CardPessoa, CarouselScroll],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  readonly loginUrl = `${environment.apiUrl}/../oauth2/authorization/google`;

  readonly currentYear = new Date().getFullYear();

  readonly membros = signal<Membro[]>([
    {
      nome: 'Vinicius Gomes',
      email: 'viniciusgomessens@gmail.com',
      telefone: '(47) 99931-8408',
      avatar: 'https://unavatar.io/github/V1niciusGomes',
      githubUrl: 'https://github.com/V1niciusGomes',
      linkedinUrl: 'https://www.linkedin.com/in/v1niciusgomessens/',
      contribuicoes: [
        'Desenvolvimento do backend em Java JDK 21 com Spring Boot 3, aplicando arquitetura limpa, boas práticas de programação e para garantir escalabilidade, e fácil manutenção.',
        'Modelagem do banco de dados a partir da análise de requisitos, definindo entidades e relacionamentos, assegurando consistência, integridade referencial e consultas SQL otimizadas.',
        'Integração da aplicação com o banco de dados por meio do Spring Data JPA/Hibernate, implementando repositórios, consultas customizadas.',
        'Criação e validação de APIs REST seguindo o padrão RESTful, com documentação via OpenAPI/Swagger, versionamento de endpoints para garantir desempenho e confiabilidade.',
      ],
    },
    {
      nome: 'Vinicius Sebold',
      email: 'vinicius.sebold05@gmail.com',
      telefone: '(47) 99746-0018',
      avatar: 'https://unavatar.io/github/vinisebold',
      githubUrl: 'https://github.com/vinisebold',
      linkedinUrl: 'https://www.linkedin.com/in/vinisebold/',
      contribuicoes: [
        'Atuei de forma full-stack em todas as camadas do sistema, conduzindo desde a concepção visual e criação do front-end em Angular até a arquitetura e implementação do backend em Spring Boot, garantindo integração fluida e robusta.',
        'Desenvolvimento e refatoração do backend em Java com Spring Boot 3, aprimorando a arquitetura e funcionalidades principais.',
        'Realizei o deploy na nuvem via Railway e estabeleci disponibilidade contínua e pública da aplicação.',
        'Coordenei a implementação de novas funcionalidades exercendo papel de liderança técnica e garantindo a entrega de soluções completas, funcionais e seguindo boas práticas de desenvolvimento.',
      ],
    },
    {
      nome: 'Sidney Arthur',
      email: 'sidney.arthur.azevedo15@gmail.com',
      telefone: '(47) 91965-9950',
      avatar: '../../assets/sidney.jpg',
      githubUrl: 'https://github.com/Sidney-ui',
      linkedinUrl:
        'https://www.linkedin.com/in/sidney-arthur-azevedo-6822b9316/',
      contribuicoes: [
        'Criação e idealização da Landing Page da aplicação.',
        'Sugestões e ideias para design, UI/UX e consistência visual.',
        'Apoio contínuo no desenvolvimento.',
      ],
    },
    {
      nome: 'Isaac Elias',
      email: 'isaacelsantos7@gmail.com',
      telefone: '(47) 99676-4173',
      avatar: '../../assets/isaac.jpeg',
      githubUrl: 'https://github.com/IsaccElsantos',
      linkedinUrl: 'https://www.linkedin.com/in/isaac-elsantos/',
      contribuicoes: [
        'Configuração inicial da estrutura de pastas do backend.',
        'Apoio na organização do projeto.',
        'Disponibilidade para suporte durante o desenvolvimento.',
      ],
    },
    {
      nome: 'Kaio Alves',
      email: 'kaiolindos13@gmail.com',
      telefone: '(47) 99149-5090',
      avatar: '../../assets/kaio.jpeg',
      githubUrl: 'https://github.com/',
      linkedinUrl: 'https://www.linkedin.com/in/',
      contribuicoes: [
        'Desenvolvimento da tela de login da aplicação.',
        'Colaboração com sugestões e ideias durante o desenvolvimento.',
        'Apoio no design inicial e ajustes de prototipagem no Figma.',
      ],
    },
  ]);

  // Controle de modais dinâmicos
  readonly inventarioModalIndex = signal(0); // 0 = adicionar peça, 1 = registrar vendas
  readonly cadastrosModalIndex = signal(0); // 0 = adicionar cliente, 1 = adicionar fornecedor

  private inventarioIntervalId?: any;
  private cadastrosIntervalId?: any;
  private scrollListener?: () => void; // TODO: remover se não mais usado

  constructor() {
    // remove chamada de init do carrossel (agora no componente filho)
  }

  ngOnInit(): void {
    this.inventarioIntervalId = setInterval(() => {
      this.inventarioModalIndex.update((i) => (i + 1) % 2);
    }, 3000);

    this.cadastrosIntervalId = setInterval(() => {
      this.cadastrosModalIndex.update((i) => (i + 1) % 2);
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.inventarioIntervalId) clearInterval(this.inventarioIntervalId);
    if (this.cadastrosIntervalId) clearInterval(this.cadastrosIntervalId);
    // listener antigo não usado
  }

  private initializeCarouselScrollEffect(): void {
    /* deprecated: lógica movida para CarouselScroll */
  }
}

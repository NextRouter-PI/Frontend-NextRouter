<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="signup-view">
    <div class="signup-container">
      <div class="signup-header">
        <h1>Comece sua jornada</h1>
        <p class="subtitle">Escolha como deseja utilizar nossa plataforma</p>
      </div>

      <div class="role-select">
        <RouterLink 
          to="/signup/usuario/" 
          class="role-card"
        >
          <span class="mdi mdi-seat-passenger"></span>
          <div class="card-content">
            <h3>Passageiro</h3>
            <p>Encontre motoristas parceiros e empresas para suas viagens</p>
          </div>
          <div class="card-arrow">→</div>
        </RouterLink>

        <RouterLink 
          to="/signup/motorista/" 
          class="role-card"
        >
          <span class="mdi mdi-bus"></span>
          <div class="card-content">
            <h3>Motorista</h3>
            <p>Ofereça seus serviços de transporte e ganhe dinheiro</p>
          </div>
          <div class="card-arrow">→</div>
        </RouterLink>

        <RouterLink 
          to="/signup/empresa/" 
          class="role-card"
        >
          <span class="mdi mdi-domain"></span>
          <div class="card-content">
            <h3>Empresa</h3>
            <p>Gerencie uma frota de veículos e motoristas</p>
          </div>
          <div class="card-arrow">→</div>
        </RouterLink>
      </div>

      <div class="signup-footer">
        <p class="login-link">
          Já possui uma conta?
          <RouterLink to="/login" class="login-button">Fazer login</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signup-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signup-container {
  width: 100%;
  border-radius: 32px;
}

.signup-header {
  text-align: center;
  margin-bottom: 3rem;
}

.signup-header h1 {
  font-size: 2.5rem;
  color: var(--primary);
  margin-bottom: 0.75rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.5;
}

.role-select {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.role-card:hover {
  border-color: var(--primary);
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}

.mdi {
  font-size: 2.5rem;
  min-width: 60px;
  text-align: center;
  color: var(--primary);
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.card-content p {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  margin: 0;
}

.card-arrow {
  font-size: 1.5rem;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.role-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}

.signup-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.login-link {
  color: #666;
  font-size: 0.95rem;
}

.login-button {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.2s ease;
}

.login-button:hover {
  color: #fb923c;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .signup-container {
    padding: 1.5rem;
  }

  .signup-header h1 {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .role-card {
    padding: 1rem;
  }

  .card-icon {
    font-size: 2rem;
    min-width: 50px;
  }

  .card-content h3 {
    font-size: 1.1rem;
  }

  .card-content p {
    font-size: 0.85rem;
  }
}
</style>
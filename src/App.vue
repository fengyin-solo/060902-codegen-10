<template>
  <div id="app">
    <header class="site-header">
      <h1 @click="$router.push('/')" class="logo">✉️ 旧短信情书展</h1>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/wall">情书墙</router-link>
        <router-link to="/gallery">匿名广场</router-link>
        <button
          class="search-btn"
          @click="store.toggleSearch()"
          :disabled="store.loveLetters.length === 0"
          :title="store.loveLetters.length === 0 ? '请先上传短信或加载演示数据' : '全局搜索'"
        >
          🔍 搜索
        </button>
      </nav>
    </header>
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="site-footer">
      <p>💌 每一条旧短信，都是时光里的情书</p>
    </footer>
    <GlobalSearch />
  </div>
</template>

<script setup>
import { store } from '@/store'
import GlobalSearch from '@/components/GlobalSearch.vue'
</script>

<style>
.search-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
  text-decoration: none;
}

.search-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import Composer from "./components/Composer.vue";
import NicknameDialog from "./components/NicknameDialog.vue";
import PostList from "./components/PostList.vue";
import ToastStack from "./components/ToastStack.vue";
import { usePostsStore } from "./stores/posts.js";
import { useProfileStore } from "./stores/profile.js";
import { useToastStore } from "./stores/toast.js";

const posts = usePostsStore();
const profile = useProfileStore();
const toast = useToastStore();

const dialogOpen = ref(!profile.hasNickname);
const lastPublishedId = ref(null);

const visiblePosts = computed(() => posts.sortedPosts);

function handlePublish(content) {
  const result = posts.publish({ content, author: profile.nickname });

  if (!result.ok) {
    if (result.error === "no-author") {
      dialogOpen.value = true;
      toast.show("先设置一个昵称吧", "error");
    } else {
      toast.show("先写点什么吧", "error");
    }
    return;
  }

  lastPublishedId.value = result.post.id;
  toast.show(
    result.saved === false ? "已发布，但本地存储不可用，刷新后会丢失" : "已发布",
    result.saved === false ? "error" : "success"
  );
}

function handleLike(id) {
  const result = posts.toggleLike(id);
  if (result.ok && result.saved === false) {
    toast.show("点赞状态未能保存到本地", "error");
  }
}

function handleSaveNickname(name) {
  if (!profile.setNickname(name)) return;
  dialogOpen.value = false;
  toast.show("昵称已更新");
}

function handleSkipNickname() {
  profile.skip();
  dialogOpen.value = false;
  toast.show("已使用访客身份");
}

function handleCloseDialog() {
  if (!profile.hasNickname) profile.skip();
  dialogOpen.value = false;
}

function handleClear() {
  if (!window.confirm("清空所有本地动态和昵称？此操作不可撤销。")) return;

  posts.clearAll();
  profile.clear();
  lastPublishedId.value = null;
  dialogOpen.value = true;
  toast.show("本地数据已清空");
}

onBeforeUnmount(() => {
  toast.disposeAll();
});
</script>

<template>
  <div class="bg-aura" aria-hidden="true">
    <span class="aura aura--violet"></span>
    <span class="aura aura--indigo"></span>
    <span class="aura aura--pink"></span>
    <span class="aura-grid"></span>
  </div>

  <AppHeader
    :nickname="profile.nickname"
    :avatar-text="profile.avatarText"
    :has-nickname="profile.hasNickname"
    @edit="dialogOpen = true"
  />

  <main class="shell">
    <Composer :nickname="profile.nickname" @publish="handlePublish" />

    <PostList :posts="visiblePosts" :highlight-id="lastPublishedId" @like="handleLike" />

    <footer class="footer">
      <p class="footer__note">
        <span class="dot" aria-hidden="true"></span>
        所有内容仅保存在本机浏览器，不会上传到任何服务器
      </p>
      <button type="button" class="link-btn" data-test="clear-data" @click="handleClear">
        清空本地数据
      </button>
    </footer>
  </main>

  <NicknameDialog
    :open="dialogOpen"
    :initial="profile.nickname"
    @save="handleSaveNickname"
    @skip="handleSkipNickname"
    @close="handleCloseDialog"
  />

  <ToastStack />
</template>

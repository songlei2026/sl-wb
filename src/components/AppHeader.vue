<script setup>
defineProps({
  nickname: { type: String, default: "" },
  avatarText: { type: String, default: "访" },
  hasNickname: { type: Boolean, default: false }
});

defineEmits(["edit"]);
</script>

<template>
  <header class="topbar">
    <div class="topbar__inner">
      <a class="brand" href="./" aria-label="sl-wb 首页">
        <span class="brand__mark" aria-hidden="true">sl</span>
        <span class="brand__text">
          <strong>sl-wb</strong>
          <small>本地动态流</small>
        </span>
      </a>

      <button
        type="button"
        class="profile-chip"
        data-test="profile-chip"
        :aria-label="hasNickname ? `当前昵称 ${nickname}，点击修改` : '设置昵称'"
        @click="$emit('edit')"
      >
        <span class="profile-chip__avatar" aria-hidden="true">{{ avatarText }}</span>
        <span class="profile-chip__name">{{ nickname || "设置昵称" }}</span>
        <span class="profile-chip__edit" aria-hidden="true">编辑</span>
      </button>
    </div>
  </header>
</template>

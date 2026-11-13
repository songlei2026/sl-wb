/* ============================================================
   sl-wb — 本地动态流
   分层：store（存取） / view（渲染） / events（交互）
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = {
    POSTS_KEY: "slwb.posts.v1",
    PROFILE_KEY: "slwb.profile.v1",
    MAX_LENGTH: 280,
    NICKNAME_MAX: 16,
    DEFAULT_NICKNAME: "访客"
  };

  var RING_LENGTH = 97.4;

  /* ---------------- DOM ---------------- */
  var el = {
    composerInput: document.getElementById("composerInput"),
    publishBtn: document.getElementById("publishBtn"),
    counter: document.getElementById("counter"),
    counterBar: document.getElementById("counterBar"),
    counterNum: document.getElementById("counterNum"),
    postList: document.getElementById("postList"),
    emptyState: document.getElementById("emptyState"),
    feedCount: document.getElementById("feedCount"),
    profileBtn: document.getElementById("profileBtn"),
    profileName: document.getElementById("profileName"),
    profileAvatar: document.getElementById("profileAvatar"),
    composerAvatar: document.getElementById("composerAvatar"),
    profileDialog: document.getElementById("profileDialog"),
    nicknameInput: document.getElementById("nicknameInput"),
    nicknameError: document.getElementById("nicknameError"),
    saveNicknameBtn: document.getElementById("saveNicknameBtn"),
    skipNicknameBtn: document.getElementById("skipNicknameBtn"),
    clearBtn: document.getElementById("clearBtn"),
    toastStack: document.getElementById("toastStack")
  };

  /* ---------------- store ---------------- */
  var store = {
    canUse: (function () {
      try {
        var k = "__slwb_probe__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
      } catch (err) {
        return false;
      }
    })(),

    loadPosts: function () {
      if (!store.canUse) return [];
      try {
        var raw = window.localStorage.getItem(CONFIG.POSTS_KEY);
        if (!raw) return [];
        var data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        return data.filter(function (p) {
          return (
            p &&
            typeof p.id === "string" &&
            typeof p.content === "string" &&
            typeof p.createdAt === "number" &&
            isFinite(p.createdAt)
          );
        }).map(function (p) {
          return {
            id: p.id,
            author: typeof p.author === "string" && p.author ? p.author : CONFIG.DEFAULT_NICKNAME,
            content: p.content,
            createdAt: p.createdAt,
            likes: typeof p.likes === "number" && p.likes >= 0 ? Math.floor(p.likes) : 0,
            liked: p.liked === true
          };
        });
      } catch (err) {
        return [];
      }
    },

    savePosts: function (posts) {
      if (!store.canUse) return false;
      try {
        window.localStorage.setItem(CONFIG.POSTS_KEY, JSON.stringify(posts));
        return true;
      } catch (err) {
        return false;
      }
    },

    loadProfile: function () {
      if (!store.canUse) return null;
      try {
        var raw = window.localStorage.getItem(CONFIG.PROFILE_KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (data && typeof data.nickname === "string" && data.nickname.trim()) {
          return { nickname: data.nickname.trim().slice(0, CONFIG.NICKNAME_MAX) };
        }
        return null;
      } catch (err) {
        return null;
      }
    },

    saveProfile: function (profile) {
      if (!store.canUse) return false;
      try {
        window.localStorage.setItem(CONFIG.PROFILE_KEY, JSON.stringify(profile));
        return true;
      } catch (err) {
        return false;
      }
    },

    clear: function () {
      if (!store.canUse) return false;
      try {
        window.localStorage.removeItem(CONFIG.POSTS_KEY);
        window.localStorage.removeItem(CONFIG.PROFILE_KEY);
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  /* ---------------- state ---------------- */
  var state = {
    posts: store.loadPosts(),
    profile: store.loadProfile(),
    animateId: null,
    editingProfile: false
  };

  /* ---------------- helpers ---------------- */
  function getNickname() {
    return state.profile ? state.profile.nickname : "";
  }

  function initialOf(name) {
    var text = (name || "").trim();
    if (!text) return "访";
    var chars = Array.from(text);
    return chars[0].toUpperCase();
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function hashHue(seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) % 360;
    }
    return h;
  }

  function relativeTime(ts) {
    var diff = Date.now() - ts;
    if (diff < 0) diff = 0;
    var minute = 60 * 1000;
    var hour = 60 * minute;
    var day = 24 * hour;

    if (diff < minute) return "刚刚";
    if (diff < hour) return Math.floor(diff / minute) + " 分钟前";
    if (diff < day) return Math.floor(diff / hour) + " 小时前";

    var d = new Date(ts);
    var now = new Date();
    if (d.getFullYear() === now.getFullYear()) {
      return d.getMonth() + 1 + "月" + d.getDate() + "日";
    }
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  function sortPosts(posts) {
    return posts.slice().sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });
  }

  function toast(message, type) {
    var node = document.createElement("div");
    node.className = "toast" + (type === "error" ? " toast--error" : "");
    node.textContent = message;
    el.toastStack.appendChild(node);

    window.setTimeout(function () {
      node.classList.add("is-leaving");
      window.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 300);
    }, 2400);
  }

  function syncComposerChrome() {
    var len = el.composerInput.value.length;
    var ratio = Math.min(len / CONFIG.MAX_LENGTH, 1);

    el.counterNum.textContent = String(len);
    el.counterBar.style.strokeDashoffset = String(RING_LENGTH * (1 - ratio));
    el.counter.setAttribute("data-state", len > CONFIG.MAX_LENGTH * 0.9 ? "over" : len > CONFIG.MAX_LENGTH * 0.7 ? "low" : "idle");
    el.publishBtn.disabled = el.composerInput.value.trim().length === 0;
  }

  function autoGrow() {
    el.composerInput.style.height = "auto";
    el.composerInput.style.height = Math.min(el.composerInput.scrollHeight, 220) + "px";
  }

  function syncProfileChrome() {
    var name = getNickname();
    var label = name || "设置昵称";
    var initial = name ? initialOf(name) : "访";

    el.profileName.textContent = label;
    el.profileAvatar.textContent = initial;
    el.composerAvatar.textContent = initial;
    el.composerAvatar.classList.toggle("avatar--self", !name);
    el.profileBtn.setAttribute("aria-label", name ? "当前昵称 " + name + "，点击修改" : "设置昵称");
  }

  /* ---------------- view ---------------- */
  function createPostNode(post) {
    var li = document.createElement("li");
    li.className = "post" + (post.id === state.animateId ? " post--new" : "");
    li.dataset.id = post.id;

    var avatar = document.createElement("span");
    avatar.className = "post__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initialOf(post.author);
    var hue = hashHue(post.id);
    avatar.style.background =
      "linear-gradient(140deg, hsl(" + hue + ", 78%, 62%), hsl(" + ((hue + 48) % 360) + ", 72%, 52%))";

    var main = document.createElement("div");
    main.className = "post__main";

    var head = document.createElement("div");
    head.className = "post__head";

    var author = document.createElement("span");
    author.className = "post__author";
    author.textContent = post.author;

    var time = document.createElement("time");
    time.className = "post__time";
    time.dateTime = new Date(post.createdAt).toISOString();
    time.textContent = relativeTime(post.createdAt);
    time.title = new Date(post.createdAt).toLocaleString("zh-CN");

    head.appendChild(author);
    head.appendChild(time);

    var content = document.createElement("p");
    content.className = "post__content";
    content.textContent = post.content;

    var actions = document.createElement("div");
    actions.className = "post__actions";

    var likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = "like-btn" + (post.liked ? " is-liked" : "");
    likeBtn.setAttribute("data-action", "like");
    likeBtn.setAttribute("aria-pressed", post.liked ? "true" : "false");
    likeBtn.setAttribute("aria-label", (post.liked ? "取消点赞" : "点赞") + "，当前 " + post.likes + " 个赞");

    var icon = document.createElement("span");
    icon.className = "like-btn__icon";
    icon.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3l-1.5-1.4C5.9 14.8 3 12.2 3 8.9A4.9 4.9 0 0 1 7.9 4c1.6 0 3.1.8 4.1 2 1-1.2 2.5-2 4.1-2A4.9 4.9 0 0 1 21 8.9c0 3.3-2.9 5.9-7.5 10z"/></svg>';

    var count = document.createElement("span");
    count.className = "like-btn__count";
    count.textContent = String(post.likes);

    likeBtn.appendChild(icon);
    likeBtn.appendChild(count);
    actions.appendChild(likeBtn);

    main.appendChild(head);
    main.appendChild(content);
    main.appendChild(actions);

    li.appendChild(avatar);
    li.appendChild(main);
    return li;
  }

  function render() {
    var posts = sortPosts(state.posts);
    var frag = document.createDocumentFragment();

    posts.forEach(function (post) {
      frag.appendChild(createPostNode(post));
    });

    el.postList.replaceChildren(frag);
    el.emptyState.classList.toggle("is-visible", posts.length === 0);
    el.feedCount.textContent = posts.length + " 条";
    state.animateId = null;
  }

  /* ---------------- actions ---------------- */
  function publish() {
    var content = el.composerInput.value.trim();
    if (!content) {
      toast("先写点什么吧", "error");
      return;
    }

    var author = getNickname();
    if (!author) {
      openProfileDialog(true);
      return;
    }

    var post = {
      id: makeId(),
      author: author,
      content: content.slice(0, CONFIG.MAX_LENGTH),
      createdAt: Date.now(),
      likes: 0,
      liked: false
    };

    state.posts.push(post);
    state.animateId = post.id;
    var saved = store.savePosts(state.posts);

    el.composerInput.value = "";
    autoGrow();
    syncComposerChrome();
    render();

    toast(saved ? "已发布" : "已发布，但本地存储不可用，刷新后会丢失", saved ? "ok" : "error");
    el.composerInput.focus();
  }

  function toggleLike(id) {
    var target = null;
    for (var i = 0; i < state.posts.length; i++) {
      if (state.posts[i].id === id) {
        target = state.posts[i];
        break;
      }
    }
    if (!target) return;

    target.liked = !target.liked;
    target.likes = Math.max(0, target.likes + (target.liked ? 1 : -1));

    var saved = store.savePosts(state.posts);
    render();
    if (!saved) toast("点赞未能保存到本地", "error");
  }

  function setNickname(raw) {
    var name = String(raw || "").trim().slice(0, CONFIG.NICKNAME_MAX);
    if (!name) return false;

    state.profile = { nickname: name };
    var saved = store.saveProfile(state.profile);
    syncProfileChrome();
    closeProfileDialog();

    if (!saved) {
      toast("昵称未能保存，仅本次有效", "error");
    } else {
      toast("昵称已更新");
    }
    return true;
  }

  function openProfileDialog(isFirstRun) {
    state.editingProfile = true;
    el.nicknameError.hidden = true;
    el.nicknameInput.value = isFirstRun ? "" : getNickname();
    el.profileDialog.hidden = false;

    window.setTimeout(function () {
      el.nicknameInput.focus();
      el.nicknameInput.select();
    }, 60);
  }

  function closeProfileDialog() {
    var needsNickname = !getNickname();
    if (needsNickname) {
      setNickname(CONFIG.DEFAULT_NICKNAME);
      return;
    }
    state.editingProfile = false;
    el.profileDialog.hidden = true;
    el.profileBtn.focus();
  }

  function clearAll() {
    if (!window.confirm("清空所有本地动态和昵称？此操作不可撤销。")) return;

    state.posts = [];
    state.profile = null;
    store.clear();
    render();
    syncProfileChrome();
    toast("本地数据已清空");
    openProfileDialog(true);
  }

  /* ---------------- events ---------------- */
  el.composerInput.addEventListener("input", function () {
    autoGrow();
    syncComposerChrome();
  });

  el.composerInput.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!el.publishBtn.disabled) publish();
    }
  });

  el.publishBtn.addEventListener("click", publish);

  el.postList.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-action='like']");
    if (!btn) return;
    var item = btn.closest(".post");
    if (item) toggleLike(item.dataset.id);
  });

  el.profileBtn.addEventListener("click", function () {
    openProfileDialog(!getNickname());
  });

  el.saveNicknameBtn.addEventListener("click", function () {
    var ok = setNickname(el.nicknameInput.value);
    if (!ok) {
      el.nicknameError.hidden = false;
      el.nicknameInput.focus();
    }
  });

  el.nicknameInput.addEventListener("input", function () {
    el.nicknameError.hidden = true;
  });

  el.nicknameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      el.saveNicknameBtn.click();
    }
  });

  el.skipNicknameBtn.addEventListener("click", function () {
    setNickname(CONFIG.DEFAULT_NICKNAME);
  });

  el.profileDialog.addEventListener("click", function (event) {
    if (event.target.getAttribute("data-close") === "1") closeProfileDialog();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !el.profileDialog.hidden) closeProfileDialog();
  });

  el.clearBtn.addEventListener("click", clearAll);

  /* 每分钟刷新一次相对时间 */
  window.setInterval(function () {
    if (state.posts.length === 0) return;
    var nodes = el.postList.querySelectorAll(".post");
    sortPosts(state.posts).forEach(function (post, index) {
      var node = nodes[index];
      var time = node && node.querySelector(".post__time");
      if (time) time.textContent = relativeTime(post.createdAt);
    });
  }, 60000);

  /* ---------------- init ---------------- */
  syncProfileChrome();
  syncComposerChrome();
  autoGrow();
  render();

  if (!state.profile) {
    openProfileDialog(true);
  }

  if (!store.canUse) {
    toast("浏览器禁用了本地存储，本次内容不会被保存", "error");
  }
})();

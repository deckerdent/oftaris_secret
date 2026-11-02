import { createRouter, createWebHashHistory } from 'vue-router'
import StartPageView from '../views/StartPageView.vue'
import TheGameView from '../views/TheGameView.vue'
import DiscussionsView from '../views/DiscussionsView.vue'
import DiscussionThreadView from '../views/DiscussionThreadView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: StartPageView,
    },
    {
      path: '/game',
      name: 'game',
      component: TheGameView,
    },
    {
      path: '/discussions',
      name: 'discussions',
      component: DiscussionsView,
    },
    {
      path: '/discussions/:threadId',
      name: 'discussion-thread',
      component: DiscussionThreadView,
      props: true,
    },
  ],
})

export default router

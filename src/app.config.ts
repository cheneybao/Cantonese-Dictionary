export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/syllables/index',
    'pages/history/index',
    'pages/favorites/index',
    'pages/profile/index',
    'pages/word-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '粤语词典',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f9fafb'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '查词',
        iconPath: './assets/tabbar/search.png',
        selectedIconPath: './assets/tabbar/search-active.png',
      },
      {
        pagePath: 'pages/syllables/index',
        text: '检字',
        iconPath: './assets/tabbar/book.png',
        selectedIconPath: './assets/tabbar/book-active.png',
      },
      {
        pagePath: 'pages/history/index',
        text: '历史',
        iconPath: './assets/tabbar/clock.png',
        selectedIconPath: './assets/tabbar/clock-active.png',
      },
      {
        pagePath: 'pages/favorites/index',
        text: '收藏',
        iconPath: './assets/tabbar/star.png',
        selectedIconPath: './assets/tabbar/star-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      }
    ]
  }
})

import Vue from 'vue/dist/vue.js';
import VueRouter from 'vue-router';
import Hello from './components/hello.js'
import Home from './components/home.js';
import Register from './components/register.js';
import Login from './components/login.js';
import Liblogin from './components/liblogin.js'
import Feed from './components/feed.js'
import Libfeed from './components/libfeed.js'
import Logout from './components/logout.js';
import Createbook from './components/createbook.js';
import Lbook from './components/lbook.js';
import Ubook from './components/book.js';
import Createsection from './components/createsection.js'
import Lsection from './components/lsection.js'
import Usection from './components/section.js'
import Editbook from './components/editbook.js'
import Editsection from './components/editsection.js'
import Search from './components/search.js'
import Feedback from './components/feedback.js'
import Profile from './components/profile.js'
import Statspage from './components/statspage.js'

Vue.use(VueRouter);

const routes=[
    { path: '/hello', component: Hello },
    {path:'/', component: Home},
    { path: '/register', component: Register },
    { path: '/login', component: Login },
    {path:'/liblogin',component:Liblogin},
    {path:'/feed', component: Feed},
    {path:'/libfeed', component:Libfeed},
    {path:'/logout', component:Logout},
    {path:'/addbook',component: Createbook},
    {path:'/lbook/:bookID',name: 'book-detail', component: Lbook},
    {path:'/book/:bookID', component:Ubook},
    {path:'/addsection',component:Createsection},
    {path:'/lsection/:sectionID', name:'section-detail', component: Lsection},
    {path:'/section/:sectionID', component: Usection},
    {path:'/editbook/:bookID', name:'editbook', component: Editbook},
    {path:'/editsection/:sectionID', name:'editsection', component: Editsection},
    {path:'/search',component:Search},
    {path:'/book/:bookID/feedback', component: Feedback},
    {path:'/profile',component: Profile},
    {path:'/statspage', component: Statspage}

]

const router = new VueRouter({
    mode: 'history',
    routes
  });
  
  export default router;
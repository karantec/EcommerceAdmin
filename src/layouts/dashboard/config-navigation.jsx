import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const navConfig = [
  {
    title: 'dashboard',
    path: '/',
    icon: icon('ic_analytics'),
  },
  {
    title: 'user',
    path: '/user',
    icon: icon('ic_user'),
  },
  {
    title: 'Ads Banner',
    path: '/Banner',
    icon: icon('ic_user'),
  },
  
   {
    title: 'Category Of products',
    path: '/category',
    icon: icon('ic_user'),
  },
  // {
  //   title: 'SubCategory Of products',
  //   path: '/subcategory',
  //   icon: icon('ic_user'),
  // },
  {
    title: 'product',
    path: '/products',
    icon: icon('ic_cart'),
  },
  // {
  //   title: 'Vendor List',
  //   path: '/VendorList',
  //   icon: icon('ic_cart'),
  // },
  {
    title: 'Order',
    path: '/order',
    icon: icon('ic_blog'),
  },
  {
    title: 'blog',
    path: '/blog',
    icon: icon('ic_blog'),
  },
  {
    title: 'login',
    path: '/login',
    icon: icon('ic_lock'),
  },
  {
    title: 'Not found',
    path: '/404',
    icon: icon('ic_disabled'),
  },
];

export default navConfig;

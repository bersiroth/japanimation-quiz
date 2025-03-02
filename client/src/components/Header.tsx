import logo from './../assets/logo.png';

function Header() {
  return (
    <nav className="mx-auto flex p-2 lg:mx-auto lg:max-w-7xl lg:px-5">
      <div className="flex items-center text-2xl text-zinc-300 sm:text-5xl">
        <img src={logo} alt="logo" className="mr-5 h-16 w-16 rounded-3xl" />
        <span>Japanimation Quiz</span>
      </div>
    </nav>
  );
}

export default Header;

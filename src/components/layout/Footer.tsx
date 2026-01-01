import { Link } from "react-router-dom";

const Footer = () => {
  const footerLinks = {
    "Products & Services": [
      { label: "Trading", path: "/trade" },
      { label: "Transfers", path: "/transfers" },
      { label: "Investment Options", path: "/why-fidelity" },
    ],
    "Support": [
      { label: "Customer Service", path: "/customer-service" },
      { label: "FAQs", path: "/customer-service" },
      { label: "Contact Us", path: "/customer-service" },
    ],
    "About": [
      { label: "Why Fidelity", path: "/why-fidelity" },
      { label: "Careers", path: "#" },
      { label: "Newsroom", path: "#" },
    ],
    "Legal": [
      { label: "Privacy Policy", path: "#" },
      { label: "Terms of Use", path: "#" },
      { label: "Disclosures", path: "#" },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-main py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-primary-foreground/80">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-primary-foreground/10" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="ml-2 text-lg font-bold">Fidelity</span>
          </div>

          {/* Copyright */}
          <p className="text-sm text-primary-foreground/60 text-center md:text-left">
            © {new Date().getFullYear()} Fidelity Investments. All rights reserved.
          </p>

          {/* Disclaimer */}
          <p className="text-xs text-primary-foreground/50 max-w-md text-center md:text-right">
            Investment involves risk. The value of investments may go down as well as up.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { Toaster as Sonner, toast } from "sonner"

// The app is dark-only, so the toast theme is fixed (no next-themes) and the surface, border and action
// button come from tokens. font-ui keeps toast text in the UI face instead of the system font.
const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="dark"
      duration={6000}
      className="toaster group font-ui"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-ui text-sm !border-hairline group-[.toaster]:bg-grove-canopy group-[.toaster]:text-grove-cream group-[.toaster]:border-grove-moss group-[.toaster]:shadow-dialog",
          title: "font-ui",
          description: "font-ui group-[.toast]:text-grove-sage",
          actionButton:
            "font-ui group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "font-ui group-[.toast]:bg-grove-moss group-[.toast]:text-grove-cream",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }

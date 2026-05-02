export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950">
      {children}
    </div>
  )
}

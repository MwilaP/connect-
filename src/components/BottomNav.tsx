import { Link, useLocation } from "react-router-dom"
import { Home, Search, UserCircle, LayoutDashboard, Gift, CreditCard, Menu as MenuIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet"
import { Button } from "../../components/ui/button"
import { LogOut } from "lucide-react"

interface BottomNavProps {
  userRole: string | null
  hasProviderProfile: boolean
  hasClientProfile: boolean
  onSignOut: () => void
}

export function BottomNav({ userRole, hasProviderProfile, hasClientProfile, onSignOut }: BottomNavProps) {
  const location = useLocation()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path)
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-sm safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Browse - Clients Only */}
        {userRole === "client" && (
          <Link
            to="/browse"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target flex-1",
              isActive("/browse")
                ? "text-gray-900 bg-gray-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Browse</span>
          </Link>
        )}

        {/* Provider Dashboard */}
        {userRole === "provider" && hasProviderProfile && (
          <Link
            to="/provider/dashboard"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target flex-1",
              isActive("/provider/dashboard")
                ? "text-gray-900 bg-gray-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
        )}

        {/* Profile */}
        {userRole === "provider" && hasProviderProfile ? (
          <Link
            to="/provider/profile"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target flex-1",
              isActive("/provider/profile")
                ? "text-gray-900 bg-gray-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <UserCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        ) : userRole === "client" && hasClientProfile ? (
          <Link
            to="/client/profile"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target flex-1",
              isActive("/client/profile")
                ? "text-gray-900 bg-gray-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <UserCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        ) : null}

        {/* More Menu */}
        <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target flex-1",
                isActive("/referrals") || isActive("/client/subscription")
                  ? "text-gray-900 bg-gray-100"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <MenuIcon className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-3xl border-t border-gray-200 bg-white">
            <SheetHeader>
              <SheetTitle className="text-left text-xl font-semibold text-gray-900">More Options</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-6 mb-4">
              {/* Referrals */}
              <Button
                variant="ghost"
                className="w-full justify-start touch-target h-14 text-base rounded-xl hover:bg-gray-100"
                asChild
                onClick={() => setMoreMenuOpen(false)}
              >
                <Link to="/referrals">
                  <Gift className="mr-3 h-5 w-5" />
                  Referral Program
                </Link>
              </Button>

              {/* Subscription (for clients only) */}
              {userRole === "client" && hasClientProfile && (
                <Button
                  variant="ghost"
                  className="w-full justify-start touch-target h-14 text-base rounded-xl hover:bg-gray-100"
                  asChild
                  onClick={() => setMoreMenuOpen(false)}
                >
                  <Link to="/client/subscription">
                    <CreditCard className="mr-3 h-5 w-5" />
                    Subscription
                  </Link>
                </Button>
              )}

              {/* Sign Out */}
              <div className="border-t border-gray-200 pt-3 mt-2">
                <Button
                  variant="outline"
                  className="w-full justify-start touch-target h-14 text-base text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-300 rounded-xl"
                  onClick={() => {
                    onSignOut()
                    setMoreMenuOpen(false)
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

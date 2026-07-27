import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute, OwnerOnlyRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { BooksListPage } from "@/pages/books/BooksListPage";
import { BookFormPage } from "@/pages/books/BookFormPage";
import { BookDetailsPage } from "@/pages/books/BookDetailsPage";
import { EmployeesListPage } from "@/pages/employees/EmployeesListPage";
import { EmployeeFormPage } from "@/pages/employees/EmployeeFormPage";
import { EmployeeDetailsPage } from "@/pages/employees/EmployeeDetailsPage";
import { BorrowRecordsListPage } from "@/pages/borrow/BorrowRecordsListPage";
import { AuthorsPage } from "@/pages/catalog/AuthorsPage";
import { PublishersPage } from "@/pages/catalog/PublishersPage";
import { CategoriesPage } from "@/pages/catalog/CategoriesPage";
import { RoomsPage } from "@/pages/structure/RoomsPage";
import { ShelvesPage } from "@/pages/structure/ShelvesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { ActivityLogsPage } from "@/pages/ActivityLogsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ComingSoonPage } from "@/pages/ComingSoonPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="books" element={<BooksListPage />} />
                  <Route path="books/new" element={<BookFormPage />} />
                  <Route path="books/:id/edit" element={<BookFormPage />} />
                  <Route path="books/:id" element={<BookDetailsPage />} />
                  <Route path="borrow-records" element={<BorrowRecordsListPage />} />
                  <Route path="authors" element={<AuthorsPage />} />
                  <Route path="publishers" element={<PublishersPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="rooms" element={<RoomsPage />} />
                  <Route path="shelves" element={<ShelvesPage />} />
                  <Route path="employees" element={<EmployeesListPage />} />
                  <Route
                    path="employees/new"
                    element={
                      <OwnerOnlyRoute>
                        <EmployeeFormPage />
                      </OwnerOnlyRoute>
                    }
                  />
                  <Route
                    path="employees/:id/edit"
                    element={
                      <OwnerOnlyRoute>
                        <EmployeeFormPage />
                      </OwnerOnlyRoute>
                    }
                  />
                  <Route path="employees/:id" element={<EmployeeDetailsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route
                    path="activity-logs"
                    element={
                      <OwnerOnlyRoute>
                        <ActivityLogsPage />
                      </OwnerOnlyRoute>
                    }
                  />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<ComingSoonPage title="Page Not Found" />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

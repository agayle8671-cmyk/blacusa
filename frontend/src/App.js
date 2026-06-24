import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import ArticlePage from "@/pages/ArticlePage";
import CategoryPage from "@/pages/CategoryPage";
import ColdCases from "@/pages/ColdCases";
import CaseDetail from "@/pages/CaseDetail";
import SubmitTip from "@/pages/SubmitTip";
import Membership from "@/pages/Membership";
import About from "@/pages/About";
import Account from "@/pages/Account";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminArticles from "@/pages/admin/AdminArticles";
import AdminArticleEditor from "@/pages/admin/AdminArticleEditor";
import AdminCases from "@/pages/admin/AdminCases";
import AdminCaseEditor from "@/pages/admin/AdminCaseEditor";
import AdminTips from "@/pages/admin/AdminTips";
import AdminComments from "@/pages/admin/AdminComments";
import AdminHomepage from "@/pages/admin/AdminHomepage";
import AdminAudience from "@/pages/admin/AdminAudience";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/cold-cases" element={<ColdCases />} />
            <Route path="/cold-cases/:caseNumber" element={<CaseDetail />} />
            <Route path="/submit-tip" element={<SubmitTip />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/about" element={<About />} />
            <Route path="/account" element={<Account />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="homepage" element={<AdminHomepage />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/:id" element={<AdminArticleEditor />} />
            <Route path="cases" element={<AdminCases />} />
            <Route path="cases/:id" element={<AdminCaseEditor />} />
            <Route path="tips" element={<AdminTips />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="audience" element={<AdminAudience />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

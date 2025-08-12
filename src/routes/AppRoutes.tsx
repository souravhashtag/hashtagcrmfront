import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from '../features/auth/pages/Login';
import Dashboard from '../features/dashboard/pages/Dashboard';
import ScreenShort from '../features/dashboard/components/ScreenShort';
import MenuList from '../features/menu/components/MenuList';
import MenuCreate from '../features/menu/components/MenuCreate';
import RoleList from '../features/role/components/RoleList';
import RoleCreate from '../features/role/components/RoleCreate';
import EmployeeCreate from '../features/employee/components/EmployeeCreate';
import Layout from '../features/common/Layout';
import { UserProvider } from '../features/dashboard/context/DashboardContext';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import EmployeeList from '../features/employee/components/EmployeeList';
import EmployeeView from '../features/employee/components/EmployeeView';
import DepartmentList from '../features/depertment/components/DepartmentList';
import DepartmentCreate from '../features/depertment/components/DepartmentCreate';
import DesignationCreate from '../features/designation/components/DesignationCreate';
import DesignationList from '../features/designation/components/DesignationList';
import Profile from '../features/profile/component/Profile';
import Attendance from '../features/attendance/component/Attendance';
import Roster from '../features/roster/components/Roster';
import Leave from '../features/leave/components/Leave';
import LeaveView from '../features/leave/components/LeaveView';
import LeaveManagement from '../features/leave/components/LeaveManagementView';
import EmployeeAssign from '../features/employee/components/EmployeeAssign';
import Settings from '../features/settings';




const ProtectedRoute = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const [isAuthenticated] = useState(!!localStorage.getItem('token'));
  const base = process.env.REACT_APP_URL || "/";

  const ProtectedLayout = () => (
    <UserProvider>
      <Layout />
    </UserProvider>
  );

  return (
    <Provider store={store}>
      <Routes>
        <Route path={base} element={isAuthenticated ? <Navigate to={`${base}dashboard`} /> : <Login />} />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<ProtectedLayout />}>
            <Route path={`${base}dashboard`} element={<Dashboard />} />


            <Route path="menu">

              <Route index element={<MenuList />} />
              <Route path="create" element={<MenuCreate />} />
              <Route path="edit/:id" element={<MenuCreate />} />
            </Route>

            <Route path="role">
              <Route index element={<RoleList />} />
              <Route path="create" element={<RoleCreate />} />
              <Route path="edit/:id" element={<RoleCreate />} />
            </Route>

            <Route path="employee">
              <Route index element={<EmployeeList />} />
              <Route path="create" element={<EmployeeCreate />} />
              <Route path="edit/:id" element={<EmployeeCreate />} />
              <Route path=":id" element={<EmployeeView />} />
              <Route path="assign/:id" element={<EmployeeAssign />} />
            </Route>

            <Route path="department">
              <Route index element={<DepartmentList />} />
              <Route path="create" element={<DepartmentCreate />} />
              <Route path="edit/:id" element={<DepartmentCreate />} />
            </Route>

            <Route path="designations">
              <Route index element={<DesignationList />} />
              <Route path="create" element={<DesignationCreate />} />
              <Route path="edit/:id" element={<DesignationCreate />} />
            </Route>


            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings/>} />
            <Route path={`${base}screenshort`} element={<ScreenShort />} />
            <Route path="/attendance" element={<Attendance />} />

            <Route path="/roster" element={<Roster />} />
           

            <Route path="/leave" element={<Leave />} />
            <Route path="/leave/view/:id" element={<LeaveView />} />
            <Route path="/leave-management" element={<LeaveManagement />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? `${base}dashboard` : base} replace />}
        />
      </Routes>
    </Provider>
  );
};

export default AppRoutes;
